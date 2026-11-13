import { useEffect, useState } from 'react';
import { navigate } from 'gatsby';
import type { PageProps } from 'gatsby';

export const ALL_CATEGORIES = '전체';

type PostFilter = { category: string; tag: string | null };

const readFilter = (search: string): PostFilter => {
  const params = new URLSearchParams(search);
  return { category: params.get('category') || ALL_CATEGORIES, tag: params.get('tag') };
};

/**
 * 글 목록의 카테고리·태그 필터를 URL 쿼리(?category=, ?tag=)와 맞춘다.
 * 정적 HTML에는 쿼리가 없으므로 첫 렌더는 "전체"로 하고, 마운트 뒤에 URL을 읽는다.
 */
const usePostFilter = (location: PageProps['location']) => {
  const [filter, setFilter] = useState<PostFilter>({ category: ALL_CATEGORIES, tag: null });

  useEffect(() => {
    setFilter(readFilter(location.search));
  }, [location.search]);

  const update = (next: PostFilter) => {
    setFilter(next);
    const params = new URLSearchParams();
    if (next.category !== ALL_CATEGORIES) params.set('category', next.category);
    if (next.tag) params.set('tag', next.tag);
    const query = params.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ''}`);
  };

  return {
    ...filter,
    selectCategory: (category: string) => update({ ...filter, category }),
    clearTag: () => update({ ...filter, tag: null }),
  };
};

export default usePostFilter;
