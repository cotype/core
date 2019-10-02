import React, { useState, useEffect } from "react";
import styled from "styled-components/macro";
import UnpublishedContent from "./UnpublishedContent";
import UpdatedContent from "./UpdatedContent";
import api from "../api";

const Container = styled("div")`
  padding: 36px;
  width: 100%;
`;
const Flex = styled("div")`
  display: flex;
  flex-direction: row;
  justify-content: center;
  & > div:not(:last-child) {
    margin-right: 48px;
  }
  @media screen and (max-width: 786px) {
    flex-direction: column;
    & > div:not(:last-child) {
      margin-right: 0;
      margin-bottom: 48px;
    }
  }
`;

const Title = styled("h1")`
  text-align: center;
  margin-top: 0;
  margin-bottom: 36px;
  font-weight: 200;
`;
const Column = styled("div")`
  flex: 1;
  background: white;
  border-radius: 3px;
  overflow: hidden;
  max-width: 450px;
  box-shadow: 0px 2px 10px -3px rgba(0, 0, 0, 0.1);
  min-height: 515px;
  position: relative;
  @media screen and (max-width: 786px) {
    max-width: 100%;
  }
`;

export default function Dashboard() {
  const [totalCount, setTotalCount] = useState<null | {
    totalByUser: number;
    total: number;
  }>(null);

  useEffect(() => {
    let canceled = false;
    const fetchData = async () => {
      const [{ total }, { total: totalByUser }] = await Promise.all([
        api.get("/dashboard/updated?limit=0"),
        api.get("/dashboard/updated-by-user?limit=0")
      ]);
      if (!canceled) setTotalCount({ total, totalByUser });
    };
    fetchData();

    return () => {
      canceled = true;
    };
  }, []);
  return (
    <Container>
      {totalCount && (
        <Title>
          There are already <b>{totalCount.total.toLocaleString()}</b> items and
          you worked on <b>{totalCount.totalByUser.toLocaleString()}</b> of
          them.
        </Title>
      )}
      <Flex>
        <Column>
          <UnpublishedContent />
        </Column>
        <Column>
          <UpdatedContent />
        </Column>
      </Flex>
    </Container>
  );
}
