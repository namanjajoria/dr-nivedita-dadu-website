param([string]$Path, [string]$Out)
# Word file -> JSON blocks: {k: h1|h2|p|li|table, runs:[{t,b}], rows:[[cell]]}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
try {
  $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
  $sr = New-Object System.IO.StreamReader($entry.Open())
  [xml]$doc = $sr.ReadToEnd(); $sr.Close()
} finally { $zip.Dispose() }
$W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
$ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable); $ns.AddNamespace('w', $W)
function Runs($p) {
  $runs = @()
  foreach ($r in $p.SelectNodes('.//w:r', $ns)) {
    $t = ''
    foreach ($c in $r.ChildNodes) {
      if ($c.LocalName -eq 't') { $t += $c.InnerText }
      elseif ($c.LocalName -eq 'tab') { $t += ' ' }
      elseif ($c.LocalName -eq 'br') { $t += "`n" }
    }
    if ($t -eq '') { continue }
    $b = $r.SelectSingleNode('w:rPr/w:b', $ns)
    $bold = [bool]$b -and -not ($b.GetAttribute('val', $W) -in @('0', 'false'))
    $runs += [pscustomobject]@{ t = $t; b = $bold }
  }
  return ,$runs
}
$blocks = @()
foreach ($node in $doc.SelectSingleNode('//w:body', $ns).ChildNodes) {
  if ($node.LocalName -eq 'p') {
    $style = $node.SelectSingleNode('w:pPr/w:pStyle/@w:val', $ns)
    $k = 'p'
    if ($style -and $style.Value -eq 'Heading1') { $k = 'h1' }
    elseif ($style -and $style.Value -eq 'Heading2') { $k = 'h2' }
    elseif ($node.SelectSingleNode('w:pPr/w:numPr', $ns)) { $k = 'li' }
    $runs = Runs $node
    if ((($runs | ForEach-Object { $_.t }) -join '').Trim() -eq '') { continue }
    $blocks += [pscustomobject]@{ k = $k; runs = $runs }
  } elseif ($node.LocalName -eq 'tbl') {
    $rows = @()
    foreach ($row in $node.SelectNodes('w:tr', $ns)) {
      $cells = @()
      foreach ($tc in $row.SelectNodes('w:tc', $ns)) { $cells += ((($tc.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join '').Trim()) }
      $rows += ,$cells
    }
    $blocks += [pscustomobject]@{ k = 'table'; rows = $rows }
  }
}
$json = ConvertTo-Json -InputObject $blocks -Depth 8
[System.IO.File]::WriteAllText($Out, $json, (New-Object System.Text.UTF8Encoding($false)))
