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
    projects: [],
  },
  {
    period: '25.08 ~ 25.12',
    title: 'The Pinkfong Company (인턴)',
    role: 'Web Development Group Software Engineer',
    projects: [
      {
        name: '컨텐츠 피드백 시스템 개발 (진행중)',
        details: [
          'Shaka Player + peaks.js 연동 정밀 피드백 플레이어 구현',
          'ABR 적용 자동 화질 전환 및 Sprite Sheet 프리뷰 최적화 (6ms)',
          'dnd-kit 기반 영상 비교 분할탭 구현',
          '프레임 이동, 구간 점프 등 커스텀 단축키 시스템 도입',
          'SQS/EventBridge Event-Driven 미디어 처리 파이프라인 설계',
          'Semaphore 기반 Lambda 동시 실행 제어 및 재시도 로직 구현',
        ],
      },
      {
        name: '사내 카페 시스템 마이그레이션',
        details: [
          'Next.js App Router 전환으로 번들 사이즈 72% 감소',
          'TanStack Query v5 도입으로 FCP 58% 개선 (1.2s → 0.5s)',
          '영업 상태 시각화 UI 도입으로 사용자 혼선 해소',
        ],
      },
    ],
  },
];

const activity = [
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
    title: 'LikeLion',
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

const AboutPage: React.FC<PageProps> = ({ location }) => {
  return (
    <Layout location={location}>
      <ProfileCard>
        <ProfileHeader>
          <ProfileName>김규회</ProfileName>
          <ProfileRole>Frontend Developer</ProfileRole>
        </ProfileHeader>

        <IntroText>
          사용자의 목소리에서 개선의 실마리를 찾는 개발자입니다. 서비스의 정답은 언제나 사용자에게
          있다고 믿으며, 작은 문제에서도 개선의 기회를 발견하고 사용자가 체감할 수 있는 가치를
          만드는 걸 좋아해요.
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
      </Container>
    </Layout>
  );
};

export default AboutPage;

export const Head = () => <Seo title="About" />;

const Container = styled.div`
  max-width: 720px;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  margin: 48px 0 32px;
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

const IntroSection = styled.div`
  margin-bottom: 32px;
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
