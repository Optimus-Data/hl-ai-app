require("dotenv").config();
const fs = require("fs");
const path = require("node:path");
const { Document } = require("@langchain/core/documents");

async function loadDocumentsFromJson(filePath) {
	try {
		const fileContent = fs.readFileSync(filePath, "utf-8");
		const jsonData = JSON.parse(fileContent);
		const documents = [];
		const fileName = path.basename(filePath);

		if (fileName === "meditations.json") {
			for (let i = 0; i < jsonData.length; i++) {
				const item = jsonData[i];

				if (
					item.introduction &&
					item.id &&
					item.body &&
					item.title &&
					item.bible_reference &&
					item.author
				) {
					const pageContent =
						`Título: ${item.title}; Autor: ${item.author} ; Data ${ item.data }\n` +
						`Referência Bíblica: ${item.bible_reference}\n` +
						`Introdução: ${item.introduction}\n` +
						`Corpo: ${item.body}`
					const doc = new Document({
						pageContent: pageContent,
						metadata: {
							source: fileName,
							type: "data",
							id: item.id,
							author: item.author,
							index: i,
						},
					});
					documents.push(doc);
				}
			}
		}
		return documents;
	} catch (error) {
		console.error(`Erro ao processar o arquivo JSON ${filePath}:`, error);
		return [];
	}
}

module.exports = {
	loadDocumentsFromJson,
};
