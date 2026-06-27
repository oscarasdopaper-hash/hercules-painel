const cheerio = require('cheerio');

function applyAutoLinks(htmlContent, links) {
  if (!htmlContent || links.length === 0) return htmlContent;
  
  try {
    const $ = cheerio.load(htmlContent, null, false);
    
    for (const link of links) {
      if (link.limit_per_page <= 0) continue;
      
      const escapedKeyword = link.keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(?<=^|[^\\p{L}\\p{N}])(${escapedKeyword})(?=$|[^\\p{L}\\p{N}])`, 'giu');
      
      let count = 0;
      
      $('*').contents().each(function() {
        if (count >= link.limit_per_page) return false;
        
        if (this.type === 'text') {
          const parentTag = $(this).parent().get(0)?.tagName?.toLowerCase();
          if (['a', 'script', 'style', 'button'].includes(parentTag || '')) return true;
          
          const text = this.data;
          if (text && regex.test(text)) {
            const matches = text.match(regex);
            if (matches) {
              let newHtml = text;
              newHtml = newHtml.replace(regex, (match) => {
                if (count < link.limit_per_page) {
                  count++;
                  return `<a href="${link.target_url}">${match}</a>`;
                }
                return match;
              });
              
              $(this).replaceWith(newHtml);
            }
          }
        }
      });
    }
    
    return $.html();
  } catch (error) {
    console.error("Erro no motor de auto-link:", error);
    return htmlContent;
  }
}

const html = "<p>Onde encontrar a Ícone Films em Alphaville?</p><p>A ÍCONE FILMS é a melhor.</p>";
const links = [{ keyword: "Ícone Films", target_url: "https://g.page", limit_per_page: 2 }];

console.log(applyAutoLinks(html, links));
