import React from 'react';
import styled from '@emotion/styled';
import type { PageProps } from 'gatsby';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';

const career = [
  {
    period: '25.08 ~ 25.12',
    title: 'The Pinkfong Company(인턴)',
    details: ['Web Development Group Software Enginner'],
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
    title: 'GDG on Campus',
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
      <PageHeader>
        <PageTitle>About</PageTitle>
        <PageDesc>타임라인으로 보는 활동 기록</PageDesc>
      </PageHeader>

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
                <ItemDetails>
                  {item.details.map((detail, i) => (
                    <div key={i}>{detail}</div>
                  ))}
                </ItemDetails>
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

const PageHeader = styled.header`
  margin-bottom: 40px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 32px;
  color: ${({ theme }) => theme.text.primary};
`;

const PageDesc = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.text.muted};
  font-size: 16px;
`;

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
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
  color: ${({ theme }) => theme.text.primary};
  line-height: 1.5;
`;

const ItemDetails = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.text.muted};
  line-height: 1.6;
`;
