/**
 * Gatsby configuration
 */

/** @type {import('gatsby').GatsbyConfig} */
module.exports = {
  pathPrefix: '/blog',
  graphqlTypegen: true,
  siteMetadata: {
    title: `Andy Tech Blog`,
    author: {
      name: `앤디`,
      summary: `프론트엔드 개발자 앤디의 개발 기술블로그`,
    },
    description: `프론트엔드 개발자 앤디의 개발 기술블로그`,
    siteUrl: `https://kimkyuhoi.github.io/blog`,
    social: {
      twitter: ``,
      github: `KimKyuHoi`,
      linkedin: `https://www.linkedin.com/in/%EA%B7%9C%ED%9A%8C-%EA%B9%80-2ba0a5254/`,
      velog: `https://velog.io/@k_gu_wae123/posts`,
      email: `k546kh@gmail.com`,
    },
    utterancesRepo: `KimKyuHoi/blog`,
    buyMeCoffeeId: `k546khi`,
    featuredCategories: [`전체`, `개발`, `오픈소스`, `회고록`],
  },
  plugins: [
    {
      resolve: `gatsby-plugin-google-gtag`,
      options: {
        trackingIds: ['G-FBQ1CBDSJ9'],
        gtagConfig: {
          anonymize_ip: true,
        },
        pluginConfig: {
          head: true,
          respectDNT: true,
        },
      },
    },
    `gatsby-plugin-image`,
    `gatsby-plugin-emotion`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 960,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.25rem`,
            },
          },
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-prismjs`,
          `gatsby-remark-table-of-contents`,
          `gatsby-remark-autolink-headers`,
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allMarkdownRemark } }) => {
              return allMarkdownRemark.nodes.map((node) => {
                return Object.assign({}, node.frontmatter, {
                  description: node.excerpt,
                  date: node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + node.fields.slug,
                  guid: site.siteMetadata.siteUrl + node.fields.slug,
                  custom_elements: [{ 'content:encoded': node.html }],
                });
              });
            },
            query: `{
              allMarkdownRemark(sort: {frontmatter: {date: DESC}}) {
                nodes {
                  excerpt
                  html
                  fields { slug }
                  frontmatter { title date }
                }
              }
            }`,
            output: '/rss.xml',
            title: 'Andy Tech Blog RSS Feed',
          },
        ],
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Andy Tech Blog`,
        short_name: `Andy Tech`,
        start_url: `/`,
        background_color: `#ffffff`,
        display: `minimal-ui`,
        icon: `src/images/logo.svg`,
      },
    },
    {
      resolve: `gatsby-plugin-robots-txt`,
      options: {
        host: 'https://kimkyuhoi.github.io',
        sitemap: 'https://kimkyuhoi.github.io/blog/sitemap-index.xml',
        policy: [{ userAgent: '*', allow: '/' }],
      },
    },
    `gatsby-plugin-sitemap`,
    `gatsby-plugin-catch-links`,
  ],
};
