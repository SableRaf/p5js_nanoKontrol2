const path = require('path');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'p5.nanokontrol2.min.js' : 'p5.nanokontrol2.js',
      library: {
        name: 'p5nanokontrol2',
        type: 'umd',
      },
      globalObject: 'this',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    // p5 and WebMidi are provided at runtime via <script> tags, not bundled.
    externals: {
      p5: 'p5',
      webmidi: 'WebMidi',
    },
    optimization: {
      minimize: isProduction,
    },
    devtool: isProduction ? false : 'source-map',
  };
};
