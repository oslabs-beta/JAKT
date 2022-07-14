// React & React Router & React Query Modules;
import React, { useState } from "react";
import { useMutation } from "react-query";

//Components imported;
import Table from "./Table";

// UI & Visualization Libraries
import axios from "axios";
import DataStore from "../../Store";
import Xarrow, { Xwrapper } from "react-xarrows";
import { Database, DatabaseImport } from "tabler-icons-react";
import { Loader, Text, Button, Group, Modal } from "@mantine/core";

interface CanvasProps {
  fetchedData: {
    [key: string]: {
      [key: string]: {
        IsForeignKey: boolean;
        IsPrimaryKey: boolean;
        Name: string;
        References: any[];
        TableName: string;
        Value: any;
        additional_constraints: string | null;
        data_type: string;
        field_name: string;
      };
    };
  };
  isLoadingProps: boolean;
  isErrorProps: boolean;
  numEdit: number;
  setFetchedData: (fetchedData: object) => void;
  setNumEdit: (numEdit: number) => void;
  setSideBarOpened: (param: boolean) => void;
}

/** Canvas Component - a canvas section where Tables being generated */
export default function Canvas({
  isLoadingProps,
  isErrorProps,
  fetchedData,
  setFetchedData,
  setSideBarOpened,
  setNumEdit,
  numEdit,
}: CanvasProps) {
  console.log("this is fetchedData from Canvas.tsx", fetchedData);

  const [refOpened, setRefOpened] = useState(false);

  const { isLoading, isError, mutate } = useMutation(
    (dbQuery: object) => {
      console.log("logging data", dbQuery);

      return axios.post("/api/handleQueries", dbQuery).then((res) => {
        console.log("this is retrieved data from server", res.data);
      });
    },
    {
      onSuccess: () => {
        const latestTableModel: any = DataStore.getData(
          DataStore.store.size - 1
        );
        DataStore.clearStore();
        DataStore.setQuery([{ type: "", query: "" }]);
        DataStore.setData(latestTableModel);
        setFetchedData(latestTableModel);
        console.log("is DataStore cleared?", DataStore);
      },
      onError: () => {
        alert("Failed to execute changes");
        // res?.success;
      },
    }
  );

  // function to submit queries to
  const executeChanges = () => {
    // const queriesObject:object = DataStore.queries;
    // console.log('sending queries array', queriesObject);
    const obj = JSON.parse(JSON.stringify(DataStore.userDBInfo));
    // console.log(obj);

    // creating URI for server to connect to user's db
    let db_uri =
      "postgres://" +
      obj.username +
      ":" +
      obj.password +
      "@" +
      obj.hostname +
      ":" +
      obj.port +
      "/" +
      obj.database_name;
    // console.log(db_uri);

    // uri examples
    // DATABASE_URL=postgres://{user}:{password}@{hostname}:{port}/{database-name}
    // "postgres://YourUserName:YourPassword@YourHostname:5432/YourDatabaseName";

    const dbQuery = {
      queries: DataStore.getQuery(DataStore.queries.size - 1),
      uri: db_uri,
    };

    console.log("logging dbQuery", dbQuery);
    mutate(dbQuery);

    // fetch('/api/handleQueries', {
    //   method: 'POST',
    //   headers: {
    //     "Content-Type": "application/json",
    // },
    // body: JSON.stringify({
    // queries: queriesArray,
    // PG_URI: link,
    // })
    //    UPON SUCCESS MESSAGE
    //   .then((res) => res.json())
    // .then((res) => {
    //   if (!res.success) continue;
    //     console.log(res)
    //   console.log('clearing queries');
    //   DataStore.clearStore();
    //   console.log(DataStore.queries);
    // });
    //   .catch(err) => console.log(err);
    // }
  };

  /** "tables" is an array with Table components generated by iterating fetchedData */
  const tables: JSX.Element[] = Object.keys(fetchedData).map(
    (tablename: any, ind: number) => {
      return (
        <Table
          key={`Table${ind}`}
          id={tablename}
          tableInfo={fetchedData[tablename]}
          setNumEdit={setNumEdit}
          numEdit={numEdit}
          setFetchedData={setFetchedData}
        />
      );
    }
  );

  /** "refArray" is an array of Reference object where IsDestination is true */
  let refArray: string[] = [];
  for (let table in fetchedData) {
    for (let column in fetchedData[table]) {
      for (let ref in fetchedData[table][column].References) {
        if (fetchedData[table][column].References[ref].IsDestination == true)
          refArray.push(fetchedData[table][column].References[ref]);
      }
    }
  }

  /** "xa" is an array with Xarrow components generated by iterating through refArray
   * and assign start of the arrow to PrimaryKeyTableName & end of the arrow to ReferencesTableName*/
  const xa: JSX.Element[] = refArray.map((reff: any, ind:number) => {
    return (
      <Xarrow
        key={ind}
        headSize={5}
        zIndex={-1}
        color={"green"}
        start={reff.PrimaryKeyTableName}
        end={reff.ReferencesTableName}
        endAnchor={[
          { position: "right", offset: { x: +10, y: +10 } },
          { position: "left", offset: { x: -10, y: -10 } },
          { position: "bottom", offset: { x: +10, y: +10 } },
          { position: "top", offset: { x: -10 } },
        ]}
        curveness={1.0}
        animateDrawing={2}
      />
    );
  });

  /** Truthy when the user is connecting to the database to grab the intial table model */
  if (isLoadingProps) {
    return (
      <Text>
        Please Wait... It can take few minutes to complete the retrieval of data
        <Loader size="xl" variant="dots" />
      </Text>
    );
  }

  /** Truthy when the user has an issue grabbing the inital table model */
  if (isErrorProps) {
    return <>An Error Occurred: Check Your Internet Connection</>;
  }

  /** Truthy when the user is executing the queries for database migration */
  if (isLoading) {
    return (
      <h3>
        Please Wait... It can take few minutes to complete the database
        modification
        <Loader size="xl" variant="dots" />
      </h3>
    );
  }

  /** Truthy when the user fails to execute the queries for database migration */
  if (isError) {
    return <h3>An Error Occurred: Check Your Internet Connection</h3>;
  }

  return (
    <div style={{ height: "100%" }}>
      {Object.keys(fetchedData).length > 0 && DataStore.connectedToDB ? (
        <>
          <Group position="right">
            <Button id="disconnectButton"
              color="white"
              leftIcon={<DatabaseImport />}
              onClick={() => DataStore.disconnect()}
            >
              Disconnect from DB
            </Button>
          </Group>
          <Group position="right">
            <Button id="executeButton"
              styles={() => ({
                root: {
                  marginTop: 20,
                },
              })}
              color="red"
              leftIcon={<DatabaseImport />}
              onClick={() => executeChanges()}
            >
              Execute changes
            </Button>
          </Group>

          <Xwrapper>
            {tables}
            {xa}
          </Xwrapper>
        </>
      ) : (
      Object.keys(fetchedData).length > 0 && DataStore.loadedFile ? (
        <>
        <Group position="right">
            <Button
              color="white"
              leftIcon={<DatabaseImport />}
              onClick={() => setSideBarOpened(true)}
            >
              Connect to DB
            </Button>
          </Group>
          {/* <Group position="right">
            <Button id="disconnectButton"
              color="white"
              leftIcon={<DatabaseImport />}
              onClick={() => DataStore.disconnect()}
            >
              Disconnect from DB
            </Button>
          </Group>
          <Group position="right">
            <Button id="executeButton"
              styles={() => ({
                root: {
                  marginTop: 20,
                },
              })}
              color="red"
              leftIcon={<DatabaseImport />}
              onClick={() => executeChanges()}
            >
              Execute changes
            </Button>
          </Group> */}

          <Xwrapper>
            {tables}
            {xa}
          </Xwrapper>
        </>
      ) : (
        <>
          {/* "Please Connect to Your Database" */}
          <Group position="right">
            <Button
              color="white"
              leftIcon={<DatabaseImport />}
              onClick={() => setSideBarOpened(true)}
            >
              Connect to DB
            </Button>
          </Group>
        </>
      ))}
    </div>
  );
}
