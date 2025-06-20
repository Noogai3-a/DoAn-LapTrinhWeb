const Blog = require('../models/Blog');

const BLOG_BASE_URL = 'https://nhom11nt208p24.vercel.app/blog-read?post=';

const handleChatQuery = async (req, res) => {
  const message = req.body.message?.toLowerCase() || '';
  const kbAnswer = req.body.kbAnswer || null;
  let apiReply = null;

  // 🔍 Kiểm tra có cần API không
  const needsAPI =
    /blog.*(nhiều lượt xem|xem nhiều|hot|được xem)|blog.*(?:về|chủ đề)\s+.+|chủ đề blog|danh mục blog|blog có những gì|các chủ đề/.test(message);

  if (!needsAPI && kbAnswer) {
    return res.json({ reply: kbAnswer });
  }

  // 🎯 Trường hợp 1: hỏi blog được xem nhiều
  if (/blog.*(nhiều lượt xem|xem nhiều|hot|được xem)/i.test(message)) {
    try {
      const blogs = await Blog.find({ approved: true }).sort({ views: -1 }).limit(5).lean();
      if (!blogs.length) {
        apiReply = '📭 Hiện chưa có blog nào được xem nhiều.';
      } else {
        apiReply = '🔥 **Top blog được xem nhiều nhất:**\n\n' +
          blogs.map(b =>
            `• [${b.title}](${BLOG_BASE_URL}${b._id}) — 👁 ${b.views} lượt xem`
          ).join('\n');
      }
    } catch (err) {
      console.error('Lỗi truy vấn blog nhiều lượt xem:', err);
      apiReply = '⚠️ Đã xảy ra lỗi khi lấy blog.';
    }
  }

  // 🎯 Trường hợp 2: hỏi blog theo chủ đề
  else if (/blog.*(?:về|chủ đề)\s+(.+)/i.test(message)) {
    const match = message.match(/blog.*(?:về|chủ đề)\s+(.+)/i);
    const category = match?.[1]?.trim();
    if (category) {
      try {
        const blogs = await Blog.find({
          approved: true,
          category: { $regex: category, $options: 'i' }
        }).sort({ views: -1 }).limit(5).lean();

        if (!blogs.length) {
          apiReply = `📭 Không tìm thấy blog nào về chủ đề “${category}”.`;
        } else {
          apiReply = `📚 **Blog nổi bật về chủ đề “${category}”**:\n\n` +
            blogs.map(b =>
              `• [${b.title}](${BLOG_BASE_URL}${b._id}) — 👁 ${b.views} lượt xem`
            ).join('\n');
        }
      } catch (err) {
        console.error('Lỗi truy vấn blog theo chủ đề:', err);
        apiReply = '⚠️ Không thể lấy blog theo chủ đề.';
      }
    }
  }

  // 🎯 Trường hợp 3: hỏi về danh mục blog
  else if (/chủ đề blog|danh mục blog|blog có những gì|các chủ đề/i.test(message)) {
    try {
      const categories = await Blog.distinct('category');
      if (!categories.length) {
        apiReply = 'Hiện tại chưa có chủ đề blog nào.';
      } else {
        apiReply = '🗂️ **Các chủ đề blog hiện có:**\n' + categories.map(c => `• ${c}`).join('\n');
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh mục blog:', err);
      apiReply = '⚠️ Không thể lấy danh sách chủ đề blog.';
    }
  }

  const finalReply = apiReply || kbAnswer || '❓ Xin lỗi, tôi chưa hiểu câu hỏi của bạn.';
  return res.json({ reply: finalReply });
};

module.exports = { handleChatQuery };
