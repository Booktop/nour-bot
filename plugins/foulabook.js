import got from "got";
import cheerio from "cheerio";
import fetch from "node-fetch";

let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    let text;
    if (args.length >= 1) {
        text = args.join(" ");
    } else if (m.quoted && m.quoted.text) {
        text = m.quoted.text;
    } else {
        throw "Input Teks";
    }

    await m.reply("Wait...");

    if (command === "foulabookget") {
        try {
            let res = await getFoulabook(text);
            await conn.sendFile(m.chat, res[0].url, res[0].title, "", m, false, {
                asDocument: true
            });
        } catch (e) {
            throw "Error";
        }
    } else {
        try {
            let res = await searchFoulabook(text);
            let teks = res.map(v => {
                return `*[ ${v.index} ]*
🔖 *Title* : ${v.title}
🔗 *Link* : ${v.url}
   `.trim();
            }).filter(v => v).join("\n\n________________________\n\n");
            await m.reply(teks);
        } catch (e) {
            throw "Error";
        }
    }
};

handler.help = ["foulabook"];
handler.tags = ["internet"];
handler.command = /^foula|foulabookget$/i;
handler.premium = true;
export default handler;

async function searchFoulabook(query) {
    try {
        const response = await got('https://foulabook.com/ar/books?search=' + query);
        const $ = cheerio.load(response.body);
        const elements = $('div.search-result');
        const result = elements.map((i, el) => {
            const title = $('a h3', el).text().trim();
            const url = $('a', el).attr('href');
            if (/^https:\/\/foulabook\.com\/ar\/books\/\d+$/.test(url)) {
                return {
                    index: i + 1,
                    title,
                    url
                };
            }
        }).get().filter(item => item);
        return result;
    } catch (error) {
        console.log(error);
    }
}

async function getFoulabook(url) {
    try {
        const pdfRegex = /\.pdf$/i;
        const response = await got(url);
        const $ = cheerio.load(response.body);
        const results = [];
        $('a').each((i, link) => {
            const href = $(link).attr('href');
            const title = $(link).text();
            if (pdfRegex.test(href)) {
                results.push({
                    index: i + 1,
                    title,
                    url: href
                });
            }
        });
        return results;
    } catch (error) {
        console.log(error);
    }
}
