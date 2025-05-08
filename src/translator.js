import turndownPluginGfm from '@guyplusplus/turndown-plugin-gfm';
import turndown from 'turndown';
import * as shared from './shared.js';

// init single reusable turndown service object upon import
const turndownService = initTurndownService();

function initTurndownService() {
	const turndownService = new turndown({
		headingStyle: 'atx',
		bulletListMarker: '-',
		codeBlockStyle: 'fenced'
	});

	turndownService.use(turndownPluginGfm.tables);

	turndownService.remove(['style']); // <style> contents get dumped as plain text, would rather remove

	// preserve embedded tweets
	turndownService.addRule('tweet', {
		filter: (node) => node.nodeName === 'BLOCKQUOTE' && node.getAttribute('class') === 'twitter-tweet',
		replacement: (content, node) => '\n\n' + node.outerHTML
	});

	// preserve embedded codepens
	turndownService.addRule('codepen', {
		filter: (node) => {
			// codepen embed snippets have changed over the years
			// but this series of checks should find the commonalities
			return (
				['P', 'DIV'].includes(node.nodeName) &&
				node.attributes['data-slug-hash'] &&
				node.getAttribute('class') === 'codepen'
			);
		},
		replacement: (content, node) => '\n\n' + node.outerHTML
	});

	// <div> within <a> can cause extra whitespace that wreck markdown links, so this removes them
	turndownService.addRule('div', {
		filter: (node) => {
			return node.nodeName === 'DIV' && node.closest('a') !== null;
		},
		replacement: (content) => content
	});

	// preserve embedded scripts (for tweets, codepens, gists, etc.)
	turndownService.addRule('script', {
		filter: 'script',
		replacement: (content, node) => {
			let before = '\n\n';
			if (node.previousSibling && node.previousSibling.nodeName !== '#text') {
				// keep twitter and codepen <script> tags snug with the element above them
				before = '\n';
			}
			const html = node.outerHTML.replace('async=""', 'async');
			return before + html + '\n\n';
		}
	});

	// iframe boolean attributes do not need to be set to empty string
	turndownService.addRule('iframe', {
		filter: 'iframe',
		replacement: (content, node) => {
			const html = node.outerHTML
				.replace('allowfullscreen=""', 'allowfullscreen')
				.replace('allowpaymentrequest=""', 'allowpaymentrequest');
			return '\n\n' + html + '\n\n';
		}
	});

	// preserve <figure> when it contains a <figcaption>
	turndownService.addRule('figure', {
		filter: 'figure',
		replacement: (content, node) => {
			if (node.querySelector('figcaption')) {
				// extra newlines are necessary for markdown and HTML to render correctly together
				const result = '\n\n<figure>\n\n' + content + '\n\n</figure>\n\n';
				return result.replace('\n\n\n\n', '\n\n'); // collapse quadruple newlines
			} else {
				// does not contain <figcaption>, do not preserve
				return '\n' + content + '\n';
			}
		}
	});

	// preserve <figcaption>
	turndownService.addRule('figcaption', {
		filter: 'figcaption',
		replacement: (content) => {
			// extra newlines are necessary for markdown and HTML to render correctly together
			return '\n\n<figcaption>\n\n' + content + '\n\n</figcaption>\n\n';
		}
	});

	// convert <pre> into a code block with language when appropriate
	turndownService.addRule('pre', {
		filter: (node) => {
			// a <pre> with <code> inside will already render nicely, so don't interfere
			return node.nodeName === 'PRE' && !node.querySelector('code');
		},
		replacement: (content, node) => {
			const language = node.getAttribute('data-wetm-language') ?? '';
			return '\n\n```' + language + '\n' + node.textContent + '\n```\n\n';
		}
	});

	// CDB: custom turndownService
	// ================================0


	turndownService.addRule('bawt-key', {
		filter: 'bawt-key',
		replacement: function(content, node) {
		  return `{{< keyboard "${content.trim()}" >}}`;
		}
	  });

	  // CDB: dbox
	  // Custom rule for .dbox to output Hugo shortcode and keep strong/a as Markdown
		turndownService.addRule('dbox', {
			filter: function (node) {
			return node.nodeName === 'DIV' && node.classList.contains('dbox');
			},
			replacement: function (content, node) {
			const headline = node.querySelector('.dbox-headline')?.textContent.trim() || '';
			const textNode = node.querySelector('.dbox-content');
			// This will convert <strong> and <a> to Markdown
			const textMarkdown = turndownService.turndown(textNode.innerHTML);
			return `{{< warning headline="${headline}" text="${textMarkdown}" >}}`;
			}
		});

		// images to local...
		turndownService.addRule('linkedImagesToLocal', {
			filter: node => {
			  return node.nodeName === 'A' && 
					 node.querySelector('img') &&
					 node.getAttribute('href')?.includes('/wp-content/uploads/');
			},
			replacement: (content, node) => {
			  const img = node.querySelector('img');
			  const alt = img.getAttribute('alt') || '';
			  const src = img.getAttribute('src');
			  
			  // Extract filename and prepend 'images/'
			  const filename = src.split('/').pop();
			  return `![${alt}](images/${filename})`;
			}
		  });

	turndownService.addRule('ol-with-img-as-first-child', {
		filter: (node) => node.nodeName === 'OL' && node.firstChild.tagName === 'IMG',
		replacement: function (content, node) {
			const image = node.firstChild;

			node.removeChild(node.firstChild);

			return turndownService.turndown(image.outerHTML) + '\n\n' + turndownService.turndown(node.outerHTML);
		}
	});

	turndownService.addRule('ol-with-img-as-first-child-within-anchor', {
		filter: (node) => node.nodeName === 'OL' && node.firstChild.tagName === 'A' && node.firstChild.firstChild.tagName === 'IMG',
		replacement: function (content, node) {
			const image = node.firstChild.firstChild;

			node.removeChild(node.firstChild);

			return turndownService.turndown(image.outerHTML) + '\n\n' + turndownService.turndown(node.outerHTML);
		}
	});

	turndownService.addRule('ol-with-images', {
		filter: (node) => {
		  // Target IMG tags that are direct children of OL
		  // or nested inside LI within OL
		  return node.nodeName === 'IMG' && (
			node.parentNode.nodeName === 'OL' ||
			(node.parentNode.nodeName === 'LI' && node.parentNode.parentNode.nodeName === 'OL')
		  );
		},
		replacement: function (content, node) {
		  // Add two newlines before the image and one after
		  return '\n\n' + turndownService.turndown(node.outerHTML) + '\n';
		}
	  });

	return turndownService;
}

export function getPostContent(content) {

	// CUSTOM CDB:
	// =========================

	// transform [notice h=headline] shortcode
	content = content.replace(
		/\[notice\s+([^\]]*)\]([\s\S]*?)\[\/notice\]/gi,
		(match, attributesStr, body) => {
		  // Parse attributes into key-value pairs
		  const attributes = {};
		  const attributeRegex = /(\w+)="([^"]*)"/g;
		  let attrMatch;
		  while ((attrMatch = attributeRegex.exec(attributesStr)) !== null) {
			const key = attrMatch[1];
			const value = attrMatch[2];
			attributes[key] = value;
		  }
	  
		  // Validate required 'h' attribute
		  if (!attributes.h) {
			console.warn('Notice shortcode missing required "h" attribute');
			return match; // leave invalid shortcode as-is
		  }
	  
		  // Clean values and escape quotes
		  const cleanHeadline = attributes.h.replace(/"/g, '\\"');
		  const cleanType = attributes.t?.replace(/"/g, '\\"') || '';
		  const cleanBody = body.trim().replace(/"/g, '\\"');
	  
		  // Build Hugo shortcode
		  let hugoShortcode = '{{< warning ';
		  if (cleanType) hugoShortcode += `type="${cleanType}" `;
		  hugoShortcode += `headline="${cleanHeadline}" text="${cleanBody}" >}}`;
		  return hugoShortcode;
		}
	  );

	// [icon]
	content = content.replace(/\[icon\](.*?)\[\/icon\]/g, (match, iconName) => `{{< seatable-icon icon="${iconName}" >}}`);

	// [icon c="$COLOR"]
	// TODO: Does not work :/
	content = content.replaceAll('/\[icon c="grey"\](.*?)\[\/icon\]/g', (match, iconName) => `{{< seatable-icon icon="${iconName}" color="grey" >}}`);

	// [icon] transformed to HTML
	content = content.replace(
		/<span class="dtable-font ([a-zA-Z0-9_-]+)"><\/span>/g,
		(match, iconName) => `{{< seatable-icon icon="${iconName}" >}}`,
	);

	// [icon c="grey"] transformed to HTML
	content = content.replace(
		/<span class="dtable-font ([a-zA-Z0-9_-]+) dtable-font-grey"><\/span>/g,
		(match, iconName) => `{{< seatable-icon icon="${iconName}" color="grey" >}}`,
	);

	// CUSTOM CDB for FAQ:
	content = content.replace(
		/<div class="togglecontainer[^"]*">/g,
		'{{< faq >}}'
	  );
	  content = content.replace(
		/<span class="toggle_icon"><span class="vert_icon"><\/span><span class="hor_icon"><\/span><\/span><\/p>/g,
		'|||'
	  );
	  content = content.replace(
		/<\/div><\/div><\/div><\/section>\n<\/div>/g,
		'{{< /faq >}}'
	  );
	  content = content.replace(
		/<\/div><\/div><\/div><\/section>/g,
		'---'
	  );
	  content = content.replace(
		/\[toggle q="([^"]+)"\]([\s\S]*?)\[\/toggle\]/g,
		(_, q, content) => `${q}\n\n|||\n\n${content}\n\n---\n\n`
	  );
	  

	// available with (erfordert nacharbeit)
	  content = content.replace(
		/<div class="metaInfo">\s*<h3 class="betterdocs-content-heading" id="1-toc-title">Verfügbar mit <\/h3>\s*<ul>/g,
		'{{< required-version '
	  );






	// insert an empty div element between double line breaks
	// this nifty trick causes turndown to keep adjacent paragraphs separated
	// without mucking up content inside of other elements (like <code> blocks)
	content = content.replace(/(\r?\n){2}/g, '\n<div></div>\n');

	if (shared.config.saveImages === 'scraped' || shared.config.saveImages === 'all') {
		// writeImageFile() will save all content images to a relative /images
		// folder so update references in post content to match
		content = content.replace(/(<img(?=\s)[^>]+?(?<=\s)src=")[^"]*?([^/"]+?)(\?[^"]*)?("[^>]*>)/gi, '$1images/$2$4');
	}

	// preserve "more" separator, max one per post, optionally with custom label
	// by escaping angle brackets (will be unescaped during turndown conversion)
	content = content.replace(/<(!--more( .*)?--)>/, '&lt;$1&gt;');

	// some WordPress plugins specify a code language in an HTML comment above a
	// <pre> block, save it to a data attribute so the "pre" rule can use it
	content = content.replace(/(<!-- wp:.+? \{"language":"(.+?)"\} -->\r?\n<pre )/g, '$1data-wetm-language="$2" ');

	// use turndown to convert HTML to Markdown
	content = turndownService.turndown(content);

	// clean up extra spaces in list items
	content = content.replace(/(-|\d+\.) +/g, '$1 ');

	// collapse excessive newlines (can happen with a lot of <div>)
	content = content.replace(/(\r?\n){3,}/g, '\n\n');

	return content;
}
