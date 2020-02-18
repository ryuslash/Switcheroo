param(
    [string] $source,
    [string] $destination
)

Add-Type -assembly "system.io.compression.filesystem"

[io.compression.zipfile]::CreateFromDirectory($source, $destination)
