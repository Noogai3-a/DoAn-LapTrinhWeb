const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const data = require("../data.json"); // file data.json chứa thông tin subject

function normalizeTitle(filename) {
  return path.basename(filename, path.extname(filename)).replace(/[_-]/g, ' ').trim();
}

async function convertDocxToPdf(docPath, outputPdfPath) {
  const htmlResult = await mammoth.convertToHtml({ path: docPath });
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlResult.value);
  await page.pdf({ path: outputPdfPath });
  await browser.close();
}

async function generateThumbnailFromPdf(pdfPath, outputImagePath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${path.resolve(pdfPath)}#page=1`, { waitUntil: "networkidle0" });
  await page.setViewport({ width: 1280, height: 720 });
  await page.screenshot({ path: outputImagePath });
  await browser.close();
}

function getLabelsFromSlug(typeSlug, nameSlug) {
  const type = data[typeSlug];
  if (!type) return null;

  const name = type.subjects.find(s => s.slug === nameSlug);
  if (!name) return null;

  return {
    subjectTypeLabel: type.label,
    subjectNameLabel: name.label
  };
}

module.exports = {
  normalizeTitle,
  convertDocxToPdf,
  generateThumbnailFromPdf,
  getLabelsFromSlug
};
