import React from 'react';
import styled from '@emotion/styled';
import type { PageProps } from 'gatsby';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';

const career = [
  {
    period: '26.01 ~ ing',
    title: 'The Pinkfong Company',
    role: 'Web Development Group Software Engineer',
    summary: '글로벌 B2C 서비스와 300명 이상이 쓰는 사내 제품을 개발·운영하고 있습니다.',
    projects: [
      {
        name: '전사 이슈 트래커 개편',
        details: ['Umami로 수집한 사용 데이터를 근거로 UI/UX 개편'],
      },
      {
        name: '레거시 카페 어드민 현대화 및 기능 추가',
        details: [
          'Next.js 12 → 15 · React 17 → 19 전환',
          '매출 조회 화면 Speed Index 8.6초 → 0.8초 (91%), LCP 56% 단축',
          '카페 예약 주문 슬랙봇·쿠폰 일괄 관리 개발',
        ],
      },
      {
        name: '사내 CMS 번안 대본 기능 개발',
        details: [
          'Google Docs·Spreadsheet 기반 번안 대본을 CMS 타임라인에서 편집·내보내도록 개발',
          '수작업 중심이던 콘텐츠 제작 과정을 시스템화',
        ],
      },
      {
        name: '사내 디자인 시스템 설계 및 개발',
        details: [
          'Button import 기준 번들 939KB → 26KB (97%), preserveModules 적용',
          'Raw·Semantic 2계층 토큰 설계, Panda CSS → Tailwind 테마 매핑',
        ],
      },
      {
        name: '콘텐츠 피드백 시스템 개발',
        details: [
          '썸네일 첫 프리뷰 2.26초 → 11.7ms (99.48%), 3단계 WebP Sprite Sheet 로딩',
          'rAF 중복 추적을 useSyncExternalStore 기반 단일 재생 상태로 통합',
          '메타데이터·썸네일·파형·트랜스코딩을 Lambda로 분리, 재시도·DLQ 적용 (SST)',
        ],
      },
      {
        name: '핑크퐁 공식 홈페이지 개편',
        details: [
          '투명 배경 영상을 AV1·HEVC + WebGL 합성으로 재구성해 65MB → 226KB (99.6%)',
          '브라우저별 색상 불일치를 BT.709 표준화로 해소, WebGL 실패 시 Canvas 2D 폴백',
          'CloudFront 응답 헤더로 iOS Safari 다운로드 문제 해결 및 GA 측정 기준 통일',
          '리뉴얼 후 사용자당 평균 참여 시간 33초 → 1분 19초 (2.4배)',
        ],
      },
    ],
  },
  {
    period: '25.09 ~ 25.12',
    title: 'The Pinkfong Company (인턴)',
    role: 'Web Development Group Software Engineer Intern',
    summary: '미디어 업·다운로드 안정화와 임직원용 카페 서비스 레거시 개편을 맡았습니다.',
    projects: [
      {
        name: '사내 카페 시스템 레거시 개편',
        details: [
          'Next.js App Router 전환으로 초기 번들 72% 감축',
          'TanStack Query v5 도입으로 FCP 1.2초 → 0.5초 (58%)',
          '영업 상태 시각화 UI로 주문 가능 시간 혼선 해소',
        ],
      },
    ],
  },
];

const awards = [
  {
    period: '26.08',
    title: 'ICT 학점연계 프로젝트 인턴십 우수성과전 한국정보산업연합회장상',
    org: '한국정보산업연합회',
  },
  {
    period: '26.06',
    title: 'Smilegate Modacthon Hackathon 우수상',
    org: 'Smilegate',
  },
  {
    period: '24.12',
    title: 'OSSCA 오픈소스 컨트리뷰션 아카데미 Yorkie팀 특별상',
    org: '한국IT비즈니스진흥협회',
  },
  {
    period: '24.12',
    title: '오픈소스 SW 포트폴리오 경진대회 최우수상',
    org: '경북대학교 소프트웨어 교육원',
  },
  {
    period: '23.12',
    title: '대경권 공공데이터 경진대회 최우수상',
    org: '경북대학교 소프트웨어 교육원',
  },
  {
    period: '23.12',
    title: '대구를 빛내는 SW해커톤 우수상',
    org: '경북대학교 컴퓨터학부',
  },
];

const skills = [
  'TypeScript',
  'React',
  'Next.js',
  'TanStack Query',
  'Shaka Player',
  'Vite',
  'S3',
  'CloudFront',
];

const activity = [
  {
    period: '25.01',
    title: '오픈소스 기여모임',
    details: ['오픈소스 기여모임 10기'],
  },
  {
    period: '24.12 ~ 25.02',
    title: 'Smilegate Devcamp',
    details: ['Devcamp 2025'],
  },
  {
    period: '24.04 ~ 24.11',
    title: 'KaKao Tech Campus',
    details: ['Tech Campus 2nd'],
  },
  {
    period: '24.07 ~ 24.11',
    title: 'OSSCA Open Source Contribution',
    details: ['Yorkie Contributor'],
  },
  {
    period: '24.03 ~ 25.02',
    title: 'LikeLion Univ',
    details: ['LikeLion Univ Frontend TF'],
  },
  {
    period: '22.09 ~ 25.08',
    title: 'GDG on Campus KNU',
    details: [
      'GDG on Campus KNU 2nd Member',
      'GDG on Campus KNU 3rd Core Member',
      'GDG on Campus KNU 4th Organizer',
    ],
  },
];

const openSource = [
  {
    role: 'Contributor',
    name: 'shaka-project/shaka-player',
    url: 'https://github.com/shaka-project/shaka-player',
  },
  {
    role: 'Contributor',
    name: 'yorkie-team/codepair',
    url: 'https://github.com/yorkie-team/codepair',
  },
  {
    role: 'Contributor',
    name: 'yorkie-team/yorkie-team.github.io',
    url: 'https://github.com/yorkie-team/yorkie-team.github.io',
  },
];

const AboutPage: React.FC<PageProps> = ({ location }) => {
  return (
    <Layout location={location}>
      <ProfileCard>
        <ProfileHeader>
          <ProfileName>김규회</ProfileName>
          <ProfileRole>Frontend Engineer</ProfileRole>
        </ProfileHeader>

        <IntroText>
          사용자의 목소리에서 개선의 실마리를 찾는 프론트엔드 엔지니어입니다. 문제를 정의하는 데서
          멈추지 않고 브라우저·미디어 처리·CDN까지 필요한 만큼 기술 범위를 넓혀 해결합니다.
        </IntroText>

        <Divider />

        <ProfileInfo>
          <InfoRow>
            <InfoLabel>Email</InfoLabel>
            <InfoValue>k546kh@gmail.com</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Residence</InfoLabel>
            <InfoValue>Seoul, South Korea</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Education</InfoLabel>
            <InfoValue>
              Kyungpook National Univ. Computer Science and Engineering (2019.03 - 2026.02)
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Skills</InfoLabel>
            <InfoValue>{skills.join(', ')}</InfoValue>
          </InfoRow>
        </ProfileInfo>
      </ProfileCard>

      <Container>
        <SectionTitle>Career</SectionTitle>
        <Timeline>
          {career.map((item, index) => (
            <Row key={index}>
              <Period>{item.period}</Period>
              <Separator>
                <Line />
                <Dot />
              </Separator>
              <Content>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemRole>{item.role}</ItemRole>
                {item.summary && <ItemSummary>{item.summary}</ItemSummary>}
                {item.projects.map((project, pIndex) => (
                  <ProjectBlock key={pIndex}>
                    <ProjectName>■ {project.name}</ProjectName>
                    <ProjectDetails>
                      {project.details.map((detail, dIndex) => (
                        <li key={dIndex}>{detail}</li>
                      ))}
                    </ProjectDetails>
                  </ProjectBlock>
                ))}
              </Content>
            </Row>
          ))}
        </Timeline>

        <SectionTitle>Activity</SectionTitle>
        <Timeline>
          {activity.map((item, index) => (
            <Row key={index}>
              <Period>{item.period}</Period>
              <Separator>
                <Line />
                <Dot />
              </Separator>
              <Content>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemDetails>
                  {item.details.map((detail, i) => (
                    <div key={i}>{detail}</div>
                  ))}
                </ItemDetails>
              </Content>
            </Row>
          ))}
        </Timeline>

        <SectionTitle>Awards</SectionTitle>
        <Timeline>
          {awards.map((item, index) => (
            <Row key={index}>
              <Period>{item.period}</Period>
              <Separator>
                <Line />
                <Dot />
              </Separator>
              <Content>
                <AwardTitle>{item.title}</AwardTitle>
                <ItemDetails>{item.org}</ItemDetails>
              </Content>
            </Row>
          ))}
        </Timeline>

        <SectionTitle>Open Source</SectionTitle>
        <OpenSourceList>
          {openSource.map((item, index) => (
            <OpenSourceItem key={index}>
              <OpenSourceRole>{item.role}</OpenSourceRole>
              <span> – </span>
              <OpenSourceLink href={item.url} target="_blank" rel="noopener noreferrer">
                {item.name}
              </OpenSourceLink>
            </OpenSourceItem>
          ))}
        </OpenSourceList>
      </Container>
    </Layout>
  );
};

export default AboutPage;

export const Head = () => (
  <Seo
    title="About"
    pathname="/about"
    description="프론트엔드 개발자 김규회(앤디)의 소개. 경력, 활동, 오픈소스 기여 이력을 확인하세요."
  />
);

const Container = styled.div`
  max-width: 720px;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  margin: 48px 0 24px;
  color: ${({ theme }) => theme.text.primary};
`;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 140px 24px 1fr;

  @media (max-width: 768px) {
    grid-template-columns: 90px 24px 1fr;
  }
`;

const Period = styled.div`
  text-align: right;
  padding-top: 1px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text.muted};
  font-family: ${({ theme }) => theme.font.mono};
  line-height: 1.5;
`;

const Separator = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
`;

const Line = styled.div`
  width: 1px;
  background-color: ${({ theme }) => theme.border};
  height: 100%;
`;

const Dot = styled.div`
  position: absolute;
  top: 6px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.bg.page};
  border: 1.5px solid ${({ theme }) => theme.text.muted};
  z-index: 1;
`;

const Content = styled.div`
  padding-bottom: 32px;
  padding-left: 16px;
`;

const ItemTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 2px;
  color: ${({ theme }) => theme.text.primary};
  line-height: 1.4;
`;

const ItemDetails = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.text.muted};
  line-height: 1.6;
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const InfoLabel = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.text.primary};
  min-width: fit-content;
`;

const InfoValue = styled.span`
  font-size: 15px;
  color: ${({ theme }) => theme.text.muted};
`;

const IntroText = styled.p`
  margin: 0;
  font-size: 16px;
  line-height: 1.8;
  color: ${({ theme }) => theme.text.muted};
`;

const ProfileCard = styled.div`
  background: ${({ theme }) => theme.bg.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 32px;
`;

const ProfileHeader = styled.div`
  margin-bottom: 20px;
`;

const ProfileName = styled.h1`
  margin: 0 0 4px;
  font-size: 28px;
  font-weight: 800;
  color: ${({ theme }) => theme.text.primary};
`;

const ProfileRole = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.accent};
  font-weight: 600;
`;

const Divider = styled.hr`
  border: none;
  height: 1px;
  background: ${({ theme }) => theme.border};
  margin: 24px 0;
`;

const ItemRole = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.text.muted};
  margin-bottom: 14px;
`;

const ProjectBlock = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ProjectName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.text.primary};
  margin-bottom: 6px;
`;

const ProjectDetails = styled.ul`
  margin: 0;
  padding-left: 14px;
  font-size: 12px;
  color: ${({ theme }) => theme.text.muted};
  line-height: 1.7;

  li {
    margin-bottom: 4px;

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const OpenSourceList = styled.ul`
  list-style: disc;
  padding-left: 20px;
  margin: 0;
`;

const OpenSourceItem = styled.li`
  font-size: 15px;
  line-height: 1.8;
  color: ${({ theme }) => theme.text.muted};
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const OpenSourceRole = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.text.primary};
`;

const OpenSourceLink = styled.a`
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const ItemSummary = styled.p`
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.7;
  color: ${({ theme }) => theme.text.muted};
`;

const AwardTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 2px;
  color: ${({ theme }) => theme.text.primary};
  line-height: 1.5;
`;
