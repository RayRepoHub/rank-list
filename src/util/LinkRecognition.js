/*
 * @Author: YangRui
 * @Date: 2026-05-12 19:41:41
 * @LastEditors: YangRui
 * @LastEditTime: 2026-05-12 19:51:09
 * @Description: 识别文本中的网址链接，结合v-html指令使用，点击链接直接打开网页
 */
function lr(text) {
    // 匹配 img 标签
    const imgPattern = /<img[^>]*>/g;
    const imgTags = [];
    let index = 0;

    // 提取 img 标签并替换为占位符
    text = text.replace(imgPattern, function (imgTag) {
        imgTags.push(imgTag);
        return `__IMG_PLACEHOLDER_${index++}__`;
    });

    // 正则表达式匹配 www. 或 http(s):// 开头的 URL
    const urlPattern = /(https?:\/\/[^\s<]+)|(www\.[^\s<]+)/gi;
    text = text.replace(urlPattern, function (url) {
        // 如果 URL 已经以 http 或 https 开头，则直接使用
        let hyperlink = url;
        if (!hyperlink.startsWith("http")) {
            hyperlink = "http://" + hyperlink; // 为没有协议的 URL 添加 http 前缀
        }
        return `<a href="${hyperlink}" class="link-recognition-class" target="_blank" onclick="event.stopPropagation();">${url}</a>`;
    });

    // 把占位符替换回原始的 img 标签
    index = 0;
    return text.replace(/__IMG_PLACEHOLDER_(\d+)__/g, function (match, num) {
        return imgTags[parseInt(num)];
    });
}

export default {
    lr,
};