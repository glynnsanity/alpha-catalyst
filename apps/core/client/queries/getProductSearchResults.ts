import { removeEdgesAndNodes } from '@bigcommerce/catalyst-client-new';

import { newClient } from '..';
import { graphql } from '../generated';
import { SearchProductsFiltersInput, SearchProductsSortInput } from '../generated/graphql';

interface ProductSearch {
  limit?: number;
  before?: string;
  after?: string;
  sort?: SearchProductsSortInput;
  filters: SearchProductsFiltersInput;
}

const GET_PRODUCT_SEARCH_RESULTS_QUERY = /* GraphQL */ `
  query getProductSearchResults(
    $first: Int
    $after: String
    $filters: SearchProductsFiltersInput!
    $sort: SearchProductsSortInput
  ) {
    site {
      search {
        searchProducts(filters: $filters, sort: $sort) {
          products(first: $first, after: $after) {
            pageInfo {
              ...PageDetails
            }
            collectionInfo {
              totalItems
            }
            edges {
              node {
                entityId
                name
                path
                brand {
                  name
                }
                ...Prices
                defaultImage {
                  url(width: 300)
                  altText
                }
                productOptions(first: 3) {
                  edges {
                    node {
                      entityId
                    }
                  }
                }
                reviewSummary {
                  summationOfRatings
                  numberOfReviews
                  averageRating
                }
              }
            }
          }
          filters {
            edges {
              node {
                __typename
                name
                isCollapsedByDefault
                ... on BrandSearchFilter {
                  displayProductCount
                  brands {
                    pageInfo {
                      ...PageDetails
                    }
                    edges {
                      cursor
                      node {
                        entityId
                        name
                        isSelected
                        productCount
                      }
                    }
                  }
                }
                ... on CategorySearchFilter {
                  displayProductCount
                  categories {
                    pageInfo {
                      ...PageDetails
                    }
                    edges {
                      cursor
                      node {
                        entityId
                        name
                        isSelected
                        productCount
                        subCategories {
                          pageInfo {
                            ...PageDetails
                          }
                          edges {
                            cursor
                            node {
                              entityId
                              name
                              isSelected
                              productCount
                            }
                          }
                        }
                      }
                    }
                  }
                }
                ... on ProductAttributeSearchFilter {
                  displayProductCount
                  filterName
                  attributes {
                    pageInfo {
                      ...PageDetails
                    }
                    edges {
                      cursor
                      node {
                        value
                        isSelected
                        productCount
                      }
                    }
                  }
                }
                ... on RatingSearchFilter {
                  ratings {
                    pageInfo {
                      ...PageDetails
                    }
                    edges {
                      cursor
                      node {
                        value
                        isSelected
                        productCount
                      }
                    }
                  }
                }
                ... on PriceSearchFilter {
                  selected {
                    minPrice
                    maxPrice
                  }
                }
                ... on OtherSearchFilter {
                  displayProductCount
                  freeShipping {
                    isSelected
                    productCount
                  }
                  isFeatured {
                    isSelected
                    productCount
                  }
                  isInStock {
                    isSelected
                    productCount
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const getProductSearchResults = async ({
  limit = 9,
  after,
  sort,
  filters,
}: ProductSearch) => {
  const query = graphql(GET_PRODUCT_SEARCH_RESULTS_QUERY);

  const response = await newClient.fetch({
    document: query,
    variables: { first: limit, after, filters, sort },
    fetchOptions: { next: { revalidate: 300 } },
  });

  const { site } = response.data;

  const searchResults = site.search.searchProducts;

  const items = removeEdgesAndNodes(searchResults.products).map((product) => ({
    ...product,
    productOptions: removeEdgesAndNodes(product.productOptions),
  }));

  return {
    facets: {
      items: removeEdgesAndNodes(searchResults.filters).map((node) => {
        switch (node.__typename) {
          case 'BrandSearchFilter':
            return {
              ...node,
              brands: removeEdgesAndNodes(node.brands),
            };

          case 'CategorySearchFilter':
            return {
              ...node,
              categories: removeEdgesAndNodes(node.categories),
            };

          case 'ProductAttributeSearchFilter':
            return {
              ...node,
              attributes: removeEdgesAndNodes(node.attributes),
            };

          case 'RatingSearchFilter':
            return {
              ...node,
              ratings: removeEdgesAndNodes(node.ratings),
            };

          default:
            return node;
        }
      }),
    },
    products: {
      collectionInfo: searchResults.products.collectionInfo,
      pageInfo: searchResults.products.pageInfo,
      items,
    },
  };
};
