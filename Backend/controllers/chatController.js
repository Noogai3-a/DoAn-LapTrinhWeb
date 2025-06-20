const axios = require('axios');

// Domain gốc dùng để tạo link blog
const BLOG_BASE_URL = 'https://nhom11nt208p24.vercel.app/blog-read?post=';

// Hàm xử lý chat
const handleChatQuery = async (req, res) => {
  const message = req.body.message?.toLowerCase() || '';
  const kbAnswer = req.body.kbAnswer || null;
  let apiReply = null;

  // 🎯 Trường hợp 1: Hỏi blog nhiều lượt xem
  if (/blog.*(nhiều lượt xem|xem nhiều|hot|được xem)/i.test(message)) {
    try {
      const { data } = await axios.get('https://backend-yl09.onrender.com/api/blogs/top-viewed');
      if (!data.length) {
        apiReply = '📭 Hiện chưa có blog nào được xem nhiều.';
      } else {
        apiReply = '🔥 **Top blog được xem nhiều nhất:**\n\n' +
          data.map(b =>
            `• [${b.title}](${BLOG_BASE_URL}${b._id}) — 👁 ${b.views} lượt xem`
          ).join('\n');
      }
    } catch (err) {
      console.error('Lỗi khi lấy top-viewed blog:', err);
      apiReply = '⚠️ Đã xảy ra lỗi khi lấy blog hot.';
    }
  }

  // 🎯 Trường hợp 2: Hỏi blog theo chủ đề cụ thể
  else if (/blog.*(?:về|chủ đề)\s+(.+)/i.test(message)) {
    const match = message.match(/blog.*(?:về|chủ đề)\s+(.+)/i);
    const category = match?.[1]?.trim();
    if (category) {
      try {
        const { data } = await axios.get(`https://backend-yl09.onrender.com/api/blogs/top-category?category=${encodeURIComponent(category)}`);
        if (!data.length) {
          apiReply = `📭 Không tìm thấy blog nào về chủ đề “${category}”.`;
        } else {
          apiReply = `📚 **Blog nổi bật về chủ đề “${category}”**:\n\n` +
            data.map(b =>
              `• [${b.title}](${BLOG_BASE_URL}${b._id}) — 👁 ${b.views} lượt xem`
            ).join('\n');
        }
      } catch (err) {
        console.error('Lỗi khi truy vấn blog theo chủ đề:', err);
        apiReply = '⚠️ Không thể lấy blog theo chủ đề.';
      }
    }
  }

  // 🎯 Trường hợp 3: Hỏi về danh sách chủ đề blog
  else if (/chủ đề blog|danh mục blog|blog có những gì|các chủ đề/i.test(message)) {
    try {
      const { data } = await axios.get('https://backend-yl09.onrender.com/api/blogs/categories');
      if (!data.length) {
        apiReply = 'Hiện tại chưa có chủ đề blog nào.';
      } else {
        apiReply = '🗂️ **Các chủ đề blog hiện có:**\n' + data.map(c => `• ${c}`).join('\n');
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh mục blog:', err);
      apiReply = '⚠️ Không thể lấy danh sách chủ đề blog.';
    }
  }

  // 📌 Nếu không khớp câu nào ở trên
  const finalReply = apiReply || kbAnswer || '❓ Xin lỗi, tôi chưa hiểu câu hỏi của bạn.';
  return res.json({ reply: finalReply });
};

module.exports = { handleChatQuery };
