/* eslint-disable @typescript-eslint/no-require-imports */
const path = require(`path`);
const fs = require(`fs`);
const { createOgImageRenderer } = require(`./scripts/og-image`);
const { createFilePath } = require(`gatsby-source-filesystem`);

const blogPost = path.resolve(`./src/features/blog/templates/BlogPost.tsx`);

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;

  const result = await graphql(`
    {
      allMarkdownRemark(sort: { frontmatter: { date: ASC } }, limit: 1000) {
        nodes {
          id
          fields {
            slug
          }
        }
      }
    }
  `);

  if (result.errors) {
    reporter.panicOnBuild(`There was an error loading your blog posts`, result.errors);
    return;
  }

  const posts = result.data.allMarkdownRemark.nodes;

  if (posts.length > 0) {
    posts.forEach((post, index) => {
      const previousPostId = index === 0 ? null : posts[index - 1].id;
      const nextPostId = index === posts.length - 1 ? null : posts[index + 1].id;

      createPage({
        path: post.fields.slug,
        component: blogPost,
        context: {
          id: post.id,
          previousPostId,
          nextPostId,
        },
      });
    });
  }
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode });

    createNodeField({
      name: `slug`,
      node,
      value,
    });
  }
};

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;

  createTypes(`
    type SiteSiteMetadata {
      title: String
      description: String
      siteUrl: String
      author: Author
      social: Social
      utterancesRepo: String
      buyMeCoffeeId: String
      featuredCategories: [String]
    }

    type Author {
      name: String
      summary: String
    }

    type Social {
      twitter: String
      github: String
      linkedin: String
      velog: String
      email: String
    }

    type MarkdownRemark implements Node {
      frontmatter: Frontmatter
      fields: Fields
      tableOfContents: String
    }

    type Frontmatter {
      title: String
      description: String
      date: Date @dateformat
      category: String
      tags: [String]
      featured: Boolean
      hero: String
      chapter: Int
    }

    type Fields {
      slug: String
    }
  `);
};

// 개발 중에는 Emotion이 styled 선언마다 파일 전체가 담긴 소스맵을 끼워 넣는다. styled가 많은 파일
// (about.tsx는 30개)은 변환 결과가 500KB를 넘고, 그러면 Babel이 "The code generator has deoptimised
// the styling ..." 안내를 내는데 Gatsby가 이것을 ERROR UNKNOWN으로 찍는다.
// 출력 압축 여부를 Babel의 자동 판단에 맡기지 않고 명시해서 그 안내가 나오지 않게 한다.
// 실제 압축은 번들러가 하므로 결과물에는 영향이 없다.
exports.onCreateBabelConfig = ({ actions }) => {
  actions.setBabelOptions({ options: { compact: false } });
};

exports.onCreateWebpackConfig = ({ actions, getConfig }) => {
  const config = getConfig();
  const newPlugins = config.plugins.filter(
    (plugin) => plugin.constructor.name !== 'ESLintWebpackPlugin'
  );
  config.plugins = newPlugins;

  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      '@/components': path.resolve(__dirname, 'src/shared/components'),
      '@/ui': path.resolve(__dirname, 'src/shared/ui'),
      '@/styles': path.resolve(__dirname, 'src/shared/styles'),
      '@/utils': path.resolve(__dirname, 'src/shared/utils'),
      '@/types': path.resolve(__dirname, 'src/shared/types'),
      '@/features': path.resolve(__dirname, 'src/features'),
      '@/atoms': path.resolve(__dirname, 'src/shared/atoms'),
      '@/hooks': path.resolve(__dirname, 'src/shared/hooks'),
      '@/providers': path.resolve(__dirname, 'src/shared/providers'),
      '@/motion': path.resolve(__dirname, 'src/shared/motion'),
      '@/reactbits': path.resolve(__dirname, 'src/shared/reactbits'),
    },
  };

  actions.replaceWebpackConfig(config);
};

/**
 * GEO(생성형 검색 최적화): AI 답변 엔진이 사이트를 쉽게 읽도록 llms.txt 규약을 따른다.
 * - /llms.txt       글 목록과 한 줄 요약 (https://llmstxt.org)
 * - /llms-full.txt  모든 글의 마크다운 원문을 한 파일로
 * - /<slug>/index.md 글별 마크다운 원문
 *
 * 같은 자리에서 글별 공유 이미지(/og/<slug>.png)도 만든다. 대표 이미지가 없는 글을 SNS나 메신저에
 * 공유했을 때 모두 같은 기본 이미지가 뜨지 않고, 글 제목이 보이게 하기 위해서다.
 */
exports.onPostBuild = async ({ graphql, reporter }) => {
  const result = await graphql(`
    {
      site {
        siteMetadata {
          title
          description
          siteUrl
        }
      }
      allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
        nodes {
          rawMarkdownBody
          excerpt(pruneLength: 160)
          fields {
            slug
          }
          frontmatter {
            title
            description
            category
            tags
            date(formatString: "YYYY-MM-DD")
          }
        }
      }
    }
  `);

  if (result.errors) {
    reporter.warn(`llms.txt를 만들지 못했습니다: ${result.errors}`);
    return;
  }

  const { title, description, siteUrl } = result.data.site.siteMetadata;
  const posts = result.data.allMarkdownRemark.nodes;
  const publicDir = path.join(__dirname, `public`);
  const oneLine = (text) => (text || ``).replace(/\s+/g, ` `).trim();

  const toMarkdown = ({ frontmatter, fields, rawMarkdownBody }) =>
    [
      `# ${frontmatter.title}`,
      ``,
      `- URL: ${siteUrl}${fields.slug}`,
      `- 작성일: ${frontmatter.date}`,
      `- 카테고리: ${frontmatter.category || `기타`}`,
      frontmatter.tags?.length ? `- 태그: ${frontmatter.tags.join(`, `)}` : null,
      frontmatter.description ? `- 요약: ${oneLine(frontmatter.description)}` : null,
      ``,
      rawMarkdownBody.trim(),
      ``,
    ]
      .filter((line) => line !== null)
      .join(`\n`);

  const byCategory = new Map();
  posts.forEach((post) => {
    const category = post.frontmatter.category || `기타`;
    byCategory.set(category, [...(byCategory.get(category) || []), post]);
  });

  const index = [
    `# ${title}`,
    ``,
    `> ${description}. 프론트엔드 개발자 김규회(앤디)가 미디어 스트리밍, 코덱, React, 오픈소스 기여 경험을 한국어로 기록합니다.`,
    ``,
    `- 저자 소개: ${siteUrl}/about/`,
    `- 전체 글 원문: ${siteUrl}/llms-full.txt`,
    `- RSS: ${siteUrl}/rss.xml`,
    ``,
    ...[...byCategory].flatMap(([category, items]) => [
      `## ${category}`,
      ``,
      ...items.map(
        ({ frontmatter, fields, excerpt }) =>
          `- [${frontmatter.title}](${siteUrl}${fields.slug}index.md): ${oneLine(
            frontmatter.description || excerpt
          )}`
      ),
      ``,
    ]),
  ].join(`\n`);

  fs.writeFileSync(path.join(publicDir, `llms.txt`), index);
  fs.writeFileSync(path.join(publicDir, `llms-full.txt`), posts.map(toMarkdown).join(`\n---\n\n`));
  posts.forEach((post) => {
    const dir = path.join(publicDir, post.fields.slug);
    if (fs.existsSync(dir)) fs.writeFileSync(path.join(dir, `index.md`), toMarkdown(post));
  });

  reporter.info(`llms.txt, llms-full.txt, 글별 index.md ${posts.length}개를 만들었습니다.`);

  const ogDir = path.join(publicDir, `og`);
  fs.mkdirSync(ogDir, { recursive: true });
  const renderOgImage = createOgImageRenderer();
  for (const { frontmatter, fields } of posts) {
    const png = await renderOgImage({
      title: frontmatter.title,
      category: frontmatter.category || `기타`,
      siteTitle: title,
      author: `김규회`,
    });
    fs.writeFileSync(path.join(ogDir, `${ogImageName(fields.slug)}.png`), png);
  }
  reporter.info(`글별 공유 이미지 ${posts.length}개를 만들었습니다.`);
};

// "/abr/" → "abr". src/features/blog/templates/BlogPost.tsx의 ogImagePath와 같은 규칙이어야 한다.
const ogImageName = (slug) => slug.replace(/^\/|\/$/g, ``).replace(/\//g, `-`);
