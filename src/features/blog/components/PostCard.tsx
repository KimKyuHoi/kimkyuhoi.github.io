import React from "react"
import { Link } from "gatsby"
import styled from "@emotion/styled"
import { motion } from "framer-motion"

interface PostCardProps {
  slug: string
  title: string
  description?: string
  date?: string
  category?: string
  excerpt?: string
  hero?: string
  tags?: string[]
}

const PostCard: React.FC<PostCardProps> = ({ slug, title, description, date, category, excerpt, hero, tags }) => {
  return (
    <Card to={slug}>
      <Content>
        <Meta>
          <Category>{category || "기타"}</Category>
          <Date>{date}</Date>
        </Meta>
        <Title>{title}</Title>
        <Excerpt>{description || excerpt}</Excerpt>
        {tags && tags.length ? (
          <Tags>
            {tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Tags>
        ) : null}
      </Content>
    </Card>
  )
}

export default PostCard

const MotionLink = motion.create(Link)

const Card = styled(MotionLink)`
  display: block;
  padding: 24px;
  background: ${({ theme }) => theme.bg.surface};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid transparent;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.mode === "dark" ? theme.bg.muted : theme.bg.surface};
    box-shadow: ${({ theme }) => theme.shadow.hover};
    transform: translateY(-4px);
  }

  @media (max-width: 768px) {
    padding: 20px;
  }
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Meta = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  color: ${({ theme }) => theme.text.muted};
`

const Category = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
`

const Date = styled.span``

const Title = styled.h3`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
  color: ${({ theme }) => theme.text.primary};
  word-break: keep-all;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`

const Excerpt = styled.p`
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: ${({ theme }) => theme.text.muted};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  
  @media (max-width: 768px) {
    font-size: 15px;
  }
`

const Tags = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
`

const Tag = styled.span`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.bg.muted};
  color: ${({ theme }) => theme.text.muted};
  font-size: 13px;
  font-weight: 500;
`
