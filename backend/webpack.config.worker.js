const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './dist/worker_manager.js', // Replace with your entry file
  output: {
    filename: 'bundle.worker.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production',
  target: 'node', // Ensure this is set for node applications
  externals: [
    nodeExternals(),
    function({ context, request }, callback) {
      // Exclude `dist/models` directory for both relative and absolute paths
      if (request.includes('./models/')) {
        return callback(null, 'commonjs ' + request.replace(/^.*?(?=\.\/models\/)/, ''));
      }
      callback();
    }
  ],
};
