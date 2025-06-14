const badWords = [
    'fuck', 'shit', 'damn', 'bitch', 'ass',
    'đụ', 'địt', 'đéo', 'đcm', 'đcmn', 'đít',
    'lồn', 'cặc', 'đụ', 'đéo', 'đcm', 'đcmn',
    // Thêm các từ cấm khác vào đây
];

function containsBadWords(text) {
    const lowerText = text.toLowerCase();
    return badWords.some(word => lowerText.includes(word.toLowerCase()));
}

module.exports = { containsBadWords };