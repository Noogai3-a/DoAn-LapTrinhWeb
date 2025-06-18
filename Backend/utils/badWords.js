const badWords = [
     //english
    'fuck', 'fucking', 'fuk', 'f*ck', 'fu', 'fuk u', 'fuck you', 'f off', 'sex',
    'shit', 'sh*t', 'bullshit',
    'bitch', 'b!tch', 'biatch',
    'ass', 'asshole', 'a**hole', 'a-hole', 'asshat',
    'dick', 'd1ck', 'd!ck', 'dickhead',
    'cock', 'c*ck', 'coq',
    'pussy', 'p*ssy', 'p@ssy',
    'cunt', 'c*nt', 'cu*t',
    'whore', 'hoe', 'slut', 'skank', 'slag',
    'motherfucker', 'mofo', 'mf', 'm0therfucker',
    'faggot', 'fag', 'f@ggot', 'f4g',
    'wanker', 'jerk', 'jerkoff', 'douche', 'douchebag', 'twat',
    'retard', 'retarded', 'idiot', 'moron',
    'nigger', 'nigga', 'niga',
    //Tiếng việt
    'địt', 'đụ', 'đcm', 'dm', 'đm', 'dmm', 'dcm', 'đmm', 'đjt', 'dit',
    'cl', 'clm', 'cmm', 'cc', 'vcl', 'vl', 'vkl', 'vcc', 'vclm', 'lz', 'cz',
    'lồn', 'l`', 'lol', 'lon', 'l0n', 'l*n', 'l**n', 'vú', 'đít', 'ti',
    'buồi', 'b`', 'b*i', 'cặc', 'cu', 'chim', 'chym', 'đít',
    'bướm', 'âm đạo', 'âm hộ', 'loz', 'caz', 'mày', 'mẹ', 'bố', 'cha', 'má',
    'chó', 'ngu', 'đần', 'thằng', 'hãm', 'óc lợn', 'đầu bò', 'đầu đất',  'đĩ', 'điếm', 'con ranh', 'hiếp', 'dâm',
    'rác rưởi', 'phế vật', 'mất dạy', 'vô học', 'láo toét', 'xấc xược', 'ra nước',
    'tự sướng', 'thẩm du', 'tinh trùng', 'xoạc', 'nứng',  'vãi',
    'tụt quần', 'vạch háng', 'lộ hàng', 'khoe hàng',
    'đú bẩn', 'bóc bánh', 'trả tiền', 'làm gái', 'ngủ với',
    'vô văn hóa', 'không có học', 'hiếp dâm', 'giao cấu',
    'quay tay', 'thủ dâm', 'xuất tinh', 'dâm dục', 'biến thái', 'dê xồm',
    'thất học', 'kích dục', 'dâm tặc', 'lộ clip', 'clip nóng', 'chịch', 'gạ tình', 'chat sex', 'cởi truồng',
    'đập đá', 'phê thuốc', 'ngáo đá', 'đi khách', 'bán dâm', 'bóc lột'
];

function containsBadWords(text) {
    const lowerText = text.toLowerCase();
    return badWords.some(word => lowerText.includes(word.toLowerCase()));
}

module.exports = { containsBadWords };