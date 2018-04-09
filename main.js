const electron = require("electron");
const path = require("path");
const url = require("url");
const request = require("request");
const requestImageSize = require("request-image-size");
const parseXml = require("xml2js").parseString;
const cheerio = require("cheerio");
const fs = require("fs");

function createWindow(link, img, alt, width, height) {
    const screenWidth = electron.screen.getPrimaryDisplay().bounds.width;

    const mainWindow = new electron.BrowserWindow({
        x: (screenWidth - width) / 2,
        y: 0,
        width: width,
        height: height,
        transparent: true,
        frame: false,
        resizable: false,
        icon: "./google.ico"
    });
    mainWindow.doodleLink = link;
    mainWindow.doodleTitle = alt;
    mainWindow.doodleData = `<img src="${img}" alt="${alt}"/>`;
    mainWindow.exit = () => process.exit(0);
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file:",
        slashes: true,
    }))
}

electron.app.on("ready", () => {
    request("https://www.google.com/doodles/doodles.xml", (err, res, body) => {
        if(err) { console.error(err); return; }
        parseXml(body, (err, xml) => {
            if(err) { console.error(err); return; }
            // noinspection JSUnresolvedFunction
            const $ = cheerio.load(xml.rss.channel[0].item[0].description[0]);
            const $img = $("img").eq(0);
            const link = xml.rss.channel[0].item[0].link[0];
            const img = `https:${$img.attr("src")}`;
            const alt = $img.attr("alt");

            if(fs.existsSync("./.last") && fs.readFileSync("./.last", "utf-8") === alt) {
                electron.app.quit();
                process.exit(0);
                return;
            }
            fs.writeFileSync("./.last", alt, "utf-8");

            // noinspection JSUnresolvedFunction
            requestImageSize(img)
                .then(size => createWindow(link, img, alt, size.width, size.height))
                .catch(err => console.error(err));
        });
    });
});