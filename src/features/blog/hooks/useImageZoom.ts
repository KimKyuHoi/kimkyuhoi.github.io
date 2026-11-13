import { useEffect } from 'react';
import type React from 'react';

/**
 * 본문 이미지를 누르면 그 자리에서 크게 펼친다 (medium-zoom).
 * gatsby-remark-images는 이미지를 원본 파일로 가는 링크로 감싸는데, 그대로 두면 글을 떠나게 된다.
 * 링크는 남겨 두되(JS가 없을 때의 동작) 클릭은 확대로 바꾸고, 확대에는 원본 해상도 파일을 쓴다.
 */
const useImageZoom = (bodyRef: React.RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return undefined;

    const images = Array.from(body.querySelectorAll<HTMLImageElement>('img')).filter(
      // 다른 사이트로 가는 링크 안의 이미지는 그 링크의 동작을 존중한다.
      (image) => !image.closest('a:not(.gatsby-resp-image-link)')
    );
    if (!images.length) return undefined;

    let cancelled = false;
    let cleanup = () => {};

    // 이미지가 있는 글에서만, 화면이 그려진 뒤에 라이브러리를 내려받는다.
    import('medium-zoom').then(({ default: mediumZoom }) => {
      if (cancelled) return;

      const zoom = mediumZoom(images, { margin: 24, scrollOffset: 80 });
      zoom.on('open', () => {
        const page = getComputedStyle(document.body).getPropertyValue('--bg-page').trim();
        zoom.update({ background: page || '#ffffff' });
      });

      const links = images
        .map((image) => {
          const link = image.closest<HTMLAnchorElement>('a.gatsby-resp-image-link');
          if (!link) return null;
          image.setAttribute('data-zoom-src', link.href);
          // 대체 텍스트가 없는 이미지는 링크에도 이름이 없어, 보조 기술이 무엇을 하는 링크인지 알 수 없다.
          link.setAttribute(
            'aria-label',
            image.alt ? `${image.alt} 크게 보기` : '이미지 크게 보기'
          );
          const onClick = (event: MouseEvent) => {
            event.preventDefault();
            // 이미지를 직접 누른 경우는 medium-zoom이 처리한다. 키보드로 링크를 연 경우만 여기서 연다.
            if (event.target !== image) zoom.open({ target: image });
          };
          link.addEventListener('click', onClick);
          return { link, onClick };
        })
        .filter((entry) => entry !== null);

      cleanup = () => {
        links.forEach(({ link, onClick }) => link.removeEventListener('click', onClick));
        zoom.detach();
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [bodyRef]);
};

export default useImageZoom;
