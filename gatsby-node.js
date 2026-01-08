/* eslint-disable @typescript-eslint/no-require-imports */
const path = require(`path`);
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
    }

    type Fields {
      slug: String
    }
  `);
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
    },
  };

  actions.replaceWebpackConfig(config);
};
