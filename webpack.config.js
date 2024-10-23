const path = require('path');

module.exports = {
    devServer: {
        devMiddleware: {
            publicPath: "/",
        },
        static: {
            directory: path.resolve(__dirname, "./dist"),
        },
    },
    mode: "development",
    entry: {
        app: ["./app/main.tsx"],
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    module: {
        rules: [
            {
                test : /\.(ts|js)x?$/,
                loader : "babel-loader",
                exclude : /node_modules/
            },
            {
                test : /.css$/,
                use : ["style-loader", "css-loader", "postcss-loader"],
            }
        ]
    },
    output : {
        path : path.join(__dirname, "dist"),
        filename : "app.js",
    }
}