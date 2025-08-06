module.exports = {
  // Basic formatting options
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'none',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  
  // Vue specific options
  vueIndentScriptAndStyle: false,
  
  // HTML options
  htmlWhitespaceSensitivity: 'css',
  
  // Override settings for specific file types
  overrides: [
    {
      files: ['*.vue'],
      options: {
        parser: 'vue'
      }
    },
    {
      files: ['*.ts', '*.tsx'],
      options: {
        parser: 'typescript'
      }
    },
    {
      files: ['*.scss', '*.css'],
      options: {
        parser: 'scss'
      }
    },
    {
      files: ['*.json'],
      options: {
        parser: 'json',
        trailingComma: 'none'
      }
    },
    {
      files: ['*.md'],
      options: {
        parser: 'markdown',
        printWidth: 80,
        proseWrap: 'preserve'
      }
    }
  ]
}