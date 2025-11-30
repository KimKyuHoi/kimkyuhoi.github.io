import React from "react"
import styled from "@emotion/styled"
import { useStaticQuery, graphql } from "gatsby"

type CoffeeQuery = {
  site: {
    siteMetadata: {
      buyMeCoffeeId?: string | null
    } | null
  } | null
}

const BuyMeCoffee: React.FC = () => {
  const data = useStaticQuery<CoffeeQuery>(graphql`
    query CoffeeQuery {
      site {
        siteMetadata {
          buyMeCoffeeId
        }
      }
    }
  `)
  const id = data?.site?.siteMetadata?.buyMeCoffeeId

  if (!id) return null

  return (
    <Wrapper>
      <div>☕️ 글이 도움이 되셨다면 커피 한 잔으로 응원해 주세요!</div>
      <Button href={`https://www.buymeacoffee.com/${id}`} target="_blank" rel="noreferrer">
        Buy me a coffee
      </Button>
    </Wrapper>
  )
}

export default BuyMeCoffee

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin: 32px 0;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.bg.surface};
  border: 1px solid ${({ theme }) => theme.border};
  box-shadow: ${({ theme }) => theme.shadow.soft};
  flex-wrap: wrap;
`

const Button = styled.a`
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.accent};
  color: white;
  font-weight: 700;
`
