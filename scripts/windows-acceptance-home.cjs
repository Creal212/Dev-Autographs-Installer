// A file avoids Windows PowerShell 5.1 stripping quotes from `node -e` JavaScript.
process.stdout.write(require('node:os').homedir());
