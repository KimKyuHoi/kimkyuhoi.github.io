import React from "react"
import styled from "@emotion/styled"
import type { PageProps } from "gatsby"
import Layout from "@/components/Layout"
import Seo from "@/components/Seo"

const projects = [
  {
    name: "UI Sandbox",
    description: "컴포넌트 실험과 인터랙션 프로토타입",
    link: "#",
    tags: ["React", "Animation"],
  },
  {
    name: "Data Notes",
    description: "데이터/ML 실험과 시각화 메모",
    link: "#",
    tags: ["ML", "Notebook"],
  },
]

const PlaygroundPage: React.FC<PageProps> = ({ location }) => {
  return (
    <Layout location={location}>
      <Header>
        <Title>Playground</Title>
        <Desc>프로젝트와 실험 모음</Desc>
      </Header>
      <Grid>
        {projects.map(p => (
          <Card key={p.name} href={p.link} target={p.link.startsWith("http") ? "_blank" : undefined}>
            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <TagWrap>
              {p.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </TagWrap>
          </Card>
        ))}
      </Grid>
    </Layout>
  )
}

export default PlaygroundPage

export const Head = () => <Seo title="Playground" />

const Header = styled.header`
  margin-bottom: 16px;
`

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
`

const Desc = styled.p`
  margin: 6px 0 0;
  color: ${({ theme }) => theme.text.muted};
`

const Grid = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`

const Card = styled.a`
  display: grid;
  gap: 8px;
  padding: 16px;
  background: ${({ theme }) => theme.bg.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  color: inherit;
  h3 {
    margin: 0;
  }
  p {
    margin: 0;
    color: ${({ theme }) => theme.text.muted};
  }
`

const TagWrap = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`

const Tag = styled.span`
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.bg.muted};
  border: 1px solid ${({ theme }) => theme.border};
  font-size: 12px;
`
