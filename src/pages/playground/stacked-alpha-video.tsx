import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import type { PageProps } from 'gatsby';
import { withPrefix } from 'gatsby';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';

const USAGE_CODE = `<stacked-alpha-video>
  <video autoplay muted playsinline loop>
    <source
      src="stacked-av1.mp4"
      type="video/mp4; codecs=av01.0.08M.08.0.110.01.01.01.1"
    />
    <source
      src="stacked-hevc.mp4"
      type="video/mp4; codecs=hvc1.1.6.H120.b0"
    />
  </video>
</stacked-alpha-video>`;

const FFMPEG_CODE = `# 원본 영상에서 color/alpha를 분리 후 세로로 합치기
ffmpeg -i alpha-demo.mov \\
  -filter_complex \\
    "[0:v]split[main][alpha]; \\
     [alpha]alphaextract[alpha]; \\
     [main][alpha]vstack" \\
  -pix_fmt yuv420p -an \\
  -c:v libaom-av1 -crf 45 \\
  -movflags +faststart \\
  stacked-av1.mp4`;

const CSS_CODE = `stacked-alpha-video {
  display: inline-block;
}

/* 원본 video는 숨기고 canvas만 표시 */
stacked-alpha-video video {
  display: none;
}`;

const SHADER_CODE = `// Fragment Shader — 매 픽셀마다 GPU에서 실행
void main() {
  // 위쪽 절반에서 컬러(RGB) 샘플링
  vec2 colorCoord = vec2(v_texCoord.x, v_texCoord.y * 0.5);
  // 아래쪽 절반에서 알파(밝기) 샘플링
  vec2 alphaCoord = vec2(v_texCoord.x, 0.5 + v_texCoord.y * 0.5);

  vec4 color = texture2D(u_frame, colorCoord);
  float alpha = texture2D(u_frame, alphaCoord).r; // 흑백이라 R만 읽으면 됨

  // RGB + alpha를 합쳐서 canvas에 출력
  gl_FragColor = vec4(color.rgb * alpha, alpha);
  // alpha=0.0 → 투명, alpha=1.0 → 불투명
}`;

const RENDER_LOOP_CODE = `// 매 프레임마다 video → texture → shader → canvas
function drawVideo(context, video) {
  const width = video.videoWidth;
  const height = Math.floor(video.videoHeight / 2); // 세로 절반만 출력

  canvas.width = width;
  canvas.height = height;

  // video 현재 프레임을 GPU 텍스처로 업로드
  context.texImage2D(
    context.TEXTURE_2D, 0, context.RGBA,
    context.RGBA, context.UNSIGNED_BYTE, video
  );

  // shader 실행 → canvas에 그림
  context.drawArrays(context.TRIANGLES, 0, 6);
}`;

const AV1_SRC = withPrefix('/playground/stacked-av1.mp4');
const AV1_TYPE = 'video/mp4; codecs=av01.0.08M.08.0.110.01.01.01.1';
const HEVC_SRC = withPrefix('/playground/stacked-hevc.mp4');
const HEVC_TYPE = 'video/mp4; codecs=hvc1.1.6.H120.b0';

const StackedAlphaVideoPage: React.FC<PageProps> = ({ location }) => {
  useEffect(() => {
    import('stacked-alpha-video');
  }, []);

  return (
    <Layout location={location}>
      <Header>
        <Title>Stacked Alpha Video</Title>
        <Desc>
          Jake Archibald의{' '}
          <a
            href="https://github.com/jakearchibald/stacked-alpha-video"
            target="_blank"
            rel="noopener noreferrer"
          >
            stacked-alpha-video
          </a>{' '}
          Web Component를 활용한 투명 영상 구현 데모
        </Desc>
      </Header>

      {/* 1. 결과물 먼저 보여주기 */}
      <Section>
        <SectionTitle>Demo</SectionTitle>
        <SectionDesc>
          VP9(WebM)이나 HEVC(MOV)는 알파 채널을 네이티브로 지원하지만, 브라우저마다 지원하는 조합이
          달라 크로스 브라우저 대응이 어렵고 파일 크기도 큽니다. Stacked Alpha 방식은 알파 정보를
          영상 자체에 시각적으로 인코딩하여, 코덱의 알파 지원 여부와 관계없이 모든 브라우저에서 투명
          영상을 재생할 수 있습니다.
        </SectionDesc>
        <DemoWrap>
          <CardLabel>Stacked Alpha Video</CardLabel>
          <stacked-alpha-video>
            <video autoPlay muted playsInline loop>
              <source src={AV1_SRC} type={AV1_TYPE} />
              <source src={HEVC_SRC} type={HEVC_TYPE} />
            </video>
          </stacked-alpha-video>
          <CardCaption>알파 채널 없이 인코딩된 영상으로 투명 효과 구현</CardCaption>
        </DemoWrap>
      </Section>

      {/* 2. 어떻게 만들었는가 — 단계별 */}
      <Section>
        <SectionTitle>How it works</SectionTitle>
        <SectionDesc>
          핵심 아이디어는 간단합니다. 투명 정보(알파)를 영상 안에 흑백 이미지로 저장해두고,
          브라우저에서 GPU가 이를 읽어 canvas에 투명 영상으로 다시 그리는 것입니다.
        </SectionDesc>

        <StepBlock>
          <StepLabel>1. ffmpeg으로 컬러와 알파를 분리</StepLabel>
          <SectionDesc>
            원본 영상(MOV)의 각 픽셀에는 RGBA 데이터가 있습니다. R, G, B는 색상이고 A(알파)는 0~255
            사이의 숫자로, 0이면 투명, 255면 불투명입니다. ffmpeg의 <code>split</code>으로 영상을 두
            카피로 복제한 뒤, 한쪽에 <code>alphaextract</code>를 적용합니다.
          </SectionDesc>
          <CodeBlock>{FFMPEG_CODE}</CodeBlock>
        </StepBlock>

        <StepBlock>
          <StepLabel>2. alphaextract — 알파를 흑백으로 변환</StepLabel>
          <SectionDesc>
            <code>alphaextract</code>는 각 픽셀의 A값을 꺼내서 R=G=B에 넣습니다. A=255(불투명) →
            흰색, A=0(투명) → 검정. 눈에 보이지 않는 알파 데이터를 밝기로 변환하여 영상으로 저장할
            수 있게 만듭니다.
          </SectionDesc>
        </StepBlock>

        <StepBlock>
          <StepLabel>3. vstack — 세로로 합치기</StepLabel>
          <SectionDesc>
            컬러 영상(위)과 알파 흑백 영상(아래)을 세로로 합칩니다. 출력 포맷은 <code>yuv420p</code>
            로 알파 채널이 없는 일반 영상입니다.
          </SectionDesc>
          <Card>
            <VideoWrap>
              <video autoPlay muted playsInline loop>
                <source src={AV1_SRC} type={AV1_TYPE} />
                <source src={HEVC_SRC} type={HEVC_TYPE} />
              </video>
            </VideoWrap>
            <CardCaption>위: 컬러(RGB, 알파 없음) / 아래: 알파를 흑백으로 변환한 것</CardCaption>
          </Card>
        </StepBlock>

        <StepBlock>
          <StepLabel>4. Web Component로 감싸기</StepLabel>
          <SectionDesc>
            {'<stacked-alpha-video>'} 태그로 감싸면 내부적으로 {'<canvas>'}를 생성하고, 원본{' '}
            {'<video>'}는 숨깁니다. 사용자가 보는 건 video가 아니라 canvas입니다. canvas는 기본
            상태가 투명이고, GPU가 코드로 직접 픽셀을 그릴 수 있는 도화지입니다.
          </SectionDesc>
          <CodeBlock>{USAGE_CODE}</CodeBlock>
        </StepBlock>

        <StepBlock>
          <StepLabel>5. Fragment Shader — GPU가 알파를 되살림</StepLabel>
          <SectionDesc>
            shader는 GPU에서 모든 픽셀에 대해 동시에 실행되는 프로그램입니다. 위쪽 절반에서 RGB를,
            아래쪽 절반에서 R채널 밝기를 읽습니다. 흑백이라 R=G=B가 모두 같으므로 하나만 읽으면
            됩니다. 이 밝기를 alpha 값으로 사용하여, ffmpeg에서 흑백으로 변환했던 알파를 다시 원래의
            투명도로 되돌립니다. 검정(0.0)은 투명, 흰색(1.0)은 불투명이 됩니다.
          </SectionDesc>
          <CodeBlock>{SHADER_CODE}</CodeBlock>
        </StepBlock>

        <StepBlock>
          <StepLabel>6. 렌더링 루프 — video를 canvas로 옮겨 그리기</StepLabel>
          <SectionDesc>
            매 프레임마다 video의 현재 프레임을 GPU 텍스처로 업로드하고 shader를 실행하여 canvas에
            그립니다. 오브제 픽셀은 RGBA(r, g, b, 1.0)으로 불투명하게, 배경 픽셀은 RGBA(0, 0, 0,
            0.0)으로 그리지 않습니다. 비워둔 부분은 canvas의 기본 투명 상태이므로 웹페이지 배경이
            그대로 비칩니다. 영상처럼 보이지만, 실제로는 이미지를 빠르게 바꿔 그리는 것입니다.
          </SectionDesc>
          <CodeBlock>{RENDER_LOOP_CODE}</CodeBlock>
        </StepBlock>

        <StepBlock>
          <StepLabel>7. CSS 설정</StepLabel>
          <SectionDesc>
            원본 {'<video>'}는 숨기고, 웹 컴포넌트가 생성한 {'<canvas>'}만 표시합니다.
          </SectionDesc>
          <CodeBlock>{CSS_CODE}</CodeBlock>
        </StepBlock>
      </Section>

      {/* 3. 왜 이 방식인가 — Native Alpha와 비교 */}
      <Section>
        <SectionTitle>vs Native Alpha</SectionTitle>
        <SectionDesc>
          VP9(WebM)과 HEVC(MOV)는 코덱 자체에서 알파 채널을 지원하지만, VP9 알파는
          Chrome/Firefox에서만, HEVC 알파는 Safari에서만 동작하여 크로스 브라우저 대응이 어렵고 파일
          크기도 큽니다.
        </SectionDesc>

        <SizeTable>
          <thead>
            <tr>
              <th>방식</th>
              <th>포맷</th>
              <th>파일 크기</th>
              <th>Chrome/Firefox</th>
              <th>Safari</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Stacked Alpha</td>
              <td>AV1 (MP4)</td>
              <td>623KB</td>
              <td>O</td>
              <td>O</td>
            </tr>
            <tr>
              <td>Stacked Alpha</td>
              <td>HEVC (MP4)</td>
              <td>512KB</td>
              <td>-</td>
              <td>O</td>
            </tr>
            <tr>
              <td>Native Alpha</td>
              <td>VP9 (WebM)</td>
              <td>2.7MB</td>
              <td>O</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Native Alpha</td>
              <td>HEVC (MOV)</td>
              <td>4.2MB</td>
              <td>-</td>
              <td>O</td>
            </tr>
          </tbody>
        </SizeTable>

        <CompareGrid>
          <Card>
            <CardLabel>Stacked Alpha (AV1 + HEVC)</CardLabel>
            <StackedVideoWrap>
              <stacked-alpha-video>
                <video autoPlay muted playsInline loop>
                  <source src={AV1_SRC} type={AV1_TYPE} />
                  <source src={HEVC_SRC} type={HEVC_TYPE} />
                </video>
              </stacked-alpha-video>
            </StackedVideoWrap>
            <CardCaption>총 512KB ~ 623KB</CardCaption>
          </Card>

          <Card>
            <CardLabel>Native (VP9 + HEVC)</CardLabel>
            <VideoWrap>
              <video autoPlay muted playsInline loop>
                <source src={withPrefix('/playground/alpha-demo.mov')} type="video/quicktime" />
                <source src={withPrefix('/playground/alpha-demo.webm')} type="video/webm" />
              </video>
            </VideoWrap>
            <CardCaption>총 2.7MB ~ 4.2MB</CardCaption>
          </Card>
        </CompareGrid>
      </Section>

      {/* 4. FAQ */}
      <Section>
        <SectionTitle>FAQ</SectionTitle>

        <FaqItem>
          <FaqQuestion>AV1은 왜 알파 채널을 안 쓰나요?</FaqQuestion>
          <SectionDesc>
            AV1 비디오 코덱은 VP9처럼 알파 채널을 네이티브로 포함하는 기능이 없습니다. 그래서 인코딩
            시 <code>yuv420p</code>로 변환되면서 알파가 사라지고, 원본에서 투명했던 부분은 실제 RGB
            데이터인 (0, 0, 0)이 그대로 드러나 검정으로 보입니다. VP9 알파는 Chrome/Firefox에서만,
            HEVC 알파는 Safari에서만 동작하여 크로스 브라우저 대응이 어렵고 파일 크기도 큽니다.
            Stacked Alpha는 코덱의 알파 지원 여부와 관계없이, 코덱이 재생되기만 하면 동작합니다.
          </SectionDesc>
        </FaqItem>

        <FaqItem>
          <FaqQuestion>왜 알파 채널이 흑백 영상으로 보이나요?</FaqQuestion>
          <SectionDesc>
            ffmpeg의 <code>alphaextract</code> 필터가 각 픽셀의 알파값(0~255)을 꺼내서 R=G=B에
            똑같이 넣기 때문입니다. A=255(불투명) → 흰색, A=0(투명) → 검정. 숫자 하나를 세 채널에
            동일하게 넣으면 자연스럽게 흑백이 됩니다. 평소에 &ldquo;투명하게&rdquo; 보이는 것은
            소프트웨어가 이 알파 숫자를 적용해서 렌더링한 결과이지, 알파 데이터 자체가 투명한 것은
            아닙니다.
          </SectionDesc>
        </FaqItem>

        <FaqItem>
          <FaqQuestion>video인데 어떻게 투명해질 수 있나요?</FaqQuestion>
          <SectionDesc>
            사용자가 보는 건 {'<video>'}가 아니라 {'<canvas>'}입니다. canvas는 기본 상태가 투명이고,
            WebGL이 직접 각 픽셀의 RGBA를 제어할 수 있습니다. shader가 배경 픽셀에 alpha=0.0을
            넣으면 해당 픽셀을 그리지 않고, canvas의 기본 투명 상태가 유지되어 웹페이지 배경이
            비칩니다. 즉, canvas가 매 프레임마다 WebGL로 픽셀을 계산해서 다시 그리는 방식입니다.
          </SectionDesc>
        </FaqItem>

        <FaqItem>
          <FaqQuestion>우클릭으로 영상을 저장하면 왜 PNG로 받아지나요?</FaqQuestion>
          <SectionDesc>
            화면에 보이는 것이 {'<video>'}가 아니라 {'<canvas>'}이기 때문입니다. canvas를 우클릭하면
            브라우저는 현재 프레임을 이미지(PNG)로 저장합니다. 원본 MP4를 받으려면 소스 URL에 직접
            접근해야 합니다.
          </SectionDesc>
        </FaqItem>
      </Section>
    </Layout>
  );
};

export default StackedAlphaVideoPage;

export const Head = () => (
  <Seo
    title="Stacked Alpha Video"
    pathname="/playground/stacked-alpha-video/"
    description="stacked-alpha-video Web Component를 활용한 투명 영상 구현 데모"
  />
);

// --- Styled Components ---

const Header = styled.header`
  margin-bottom: 32px;

  a {
    color: ${({ theme }) => theme.accent};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
`;

const Desc = styled.p`
  margin: 6px 0 0;
  color: ${({ theme }) => theme.text.muted};
  line-height: 1.6;
`;

const Section = styled.section`
  margin-bottom: 48px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 6px;
  font-size: 20px;
`;

const SectionDesc = styled.p`
  margin: 0 0 20px;
  color: ${({ theme }) => theme.text.muted};
  line-height: 1.6;
`;

const CompareGrid = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 700px) {
    flex-direction: column;
  }
`;

const Card = styled.div`
  flex: 1 1 250px;
  min-width: 0;
  padding: 20px;
  background: ${({ theme }) => theme.bg.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  text-align: center;
`;

const CardLabel = styled.h3`
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
`;

const CardCaption = styled.p`
  margin: 10px 0 0;
  font-size: 12px;
  color: ${({ theme }) => theme.text.caption};
`;

const videoStyles = `
  stacked-alpha-video {
    display: block;
    width: 100%;
    border-radius: 8px;
  }

  stacked-alpha-video canvas {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 8px;
  }

  stacked-alpha-video video {
    display: none;
  }

  video {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 8px;
  }
`;

const VideoWrap = styled.div`
  ${videoStyles}
`;

const DemoWrap = styled.div`
  ${videoStyles}
  max-width: 480px;
  text-align: center;
`;

const StackedVideoWrap = styled.div`
  ${videoStyles}
  min-height: 150px;
`;

const SizeTable = styled.table`
  width: 100%;
  margin-bottom: 20px;
  border-collapse: collapse;
  font-size: 14px;

  th,
  td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }

  th {
    font-weight: 600;
    font-size: 13px;
    color: ${({ theme }) => theme.text.muted};
  }

  td:nth-of-type(3) {
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 13px;
  }

  td:nth-of-type(4),
  td:nth-of-type(5) {
    text-align: center;
  }
`;

const StepBlock = styled.div`
  margin-bottom: 20px;
`;

const StepLabel = styled.h4`
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
`;

const CodeBlock = styled.pre`
  margin: 0;
  padding: 16px;
  background: ${({ theme }) => theme.bg.code};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow-x: auto;
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
  color: ${({ theme }) => theme.text.inverse};
`;

const FaqItem = styled.div`
  padding: 20px 0;
  border-top: 1px solid ${({ theme }) => theme.border};

  &:last-child {
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }

  code {
    background: ${({ theme }) => theme.bg.codeInline};
    padding: 0.2rem 0.35rem;
    border-radius: ${({ theme }) => theme.radius.xs};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 13px;
  }

  ${() => SectionDesc} {
    margin-bottom: 0;
  }
`;

const FaqQuestion = styled.h4`
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
`;
