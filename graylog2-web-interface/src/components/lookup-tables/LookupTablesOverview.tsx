/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */
import * as React from 'react';

import {
  OverlayTrigger,
  PaginatedList,
  SearchForm,
  Icon,
  Spinner,
  NoSearchResult,
  NoEntitiesExist,
} from 'components/common';
import { Row, Col, Table, Popover, Button } from 'components/bootstrap';
import LUTTableEntry from 'components/lookup-tables/LUTTableEntry';
import withPaginationQueryParameter from 'components/common/withPaginationQueryParameter';
import { LookupTablesActions } from 'stores/lookup-tables/LookupTablesStore';
import type { LookupTable, LookupTableAdapter, LookupTableCache, PaginationType } from 'logic/lookup-tables/types';
import type { PaginationQueryParameterResult } from 'hooks/usePaginationQueryParameter';

import Styles from './Overview.css';

const buildHelpPopover = () => {
  return (
    <Popover id="search-query-help" className={Styles.popoverWide} title="Search Syntax Help">
      <p><strong>Available search fields</strong></p>
      <Table condensed>
        <thead>
          <tr>
            <th>Field</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>id</td>
            <td>Lookup Table ID</td>
          </tr>
          <tr>
            <td>title</td>
            <td>The title of the lookup table</td>
          </tr>
          <tr>
            <td>name</td>
            <td>The reference name of the lookup table</td>
          </tr>
          <tr>
            <td>description</td>
            <td>The description of lookup table</td>
          </tr>
        </tbody>
      </Table>
      <p><strong>Examples</strong></p>
      <p>
        Find lookup tables by parts of their names:<br />
        <kbd>name:geoip</kbd><br />
        <kbd>name:geo</kbd>
      </p>
      <p>
        Searching without a field name matches against the <code>title</code> field:<br />
        <kbd>geoip</kbd> <br />is the same as<br />
        <kbd>title:geoip</kbd>
      </p>
    </Popover>
  );
};

type ItemProps = {
  table: LookupTable,
  caches: LookupTableCache[],
  dataAdapters: LookupTableAdapter[],
  errorStates: { [key: string]: { [key: string]: string } },
};

const LUTItem = ({ table, caches, dataAdapters, errorStates }: ItemProps) => {
  const lookupName = (id: string, map: LookupTableCache[] | LookupTableAdapter[]) => {
    const empty = { title: 'none' };

    if (!map) return empty;

    return map[id] || empty;
  };

  const lookupAdapterError = () => {
    if (errorStates.dataAdapters && dataAdapters) {
      const adapter = dataAdapters[table.data_adapter_id];

      if (!adapter) return null;

      return errorStates.dataAdapters[adapter.name];
    }

    return null;
  };

  const cache = lookupName(table.cache_id, caches);
  const dataAdapter = lookupName(table.data_adapter_id, dataAdapters);
  const errors = {
    table: errorStates.tables[table.name],
    cache: null,
    dataAdapter: lookupAdapterError(),
  };

  return (
    <LUTTableEntry table={table}
                   cache={cache}
                   dataAdapter={dataAdapter}
                   errors={errors} />
  );
};

type Props = {
  tables: LookupTable[],
  caches: LookupTableCache[],
  dataAdapters: LookupTableAdapter[],
  pagination: PaginationType,
  errorStates: { [key: string]: { [key: string]: string } },
  paginationQueryParameter: PaginationQueryParameterResult,
};

const LookupTablesOverview = ({
  tables,
  caches,
  dataAdapters,
  pagination,
  errorStates,
  paginationQueryParameter,
}: Props) => {
  const [loading, setLoading] = React.useState(false);
  const [localPagination, setLocalPagination] = React.useState({
    currentPage: paginationQueryParameter.page || 1,
    currentPageSize: paginationQueryParameter.pageSize || 10,
    currentQuery: pagination.query || '',
    resetPage: paginationQueryParameter.resetPage,
    setPagination: paginationQueryParameter.setPagination,
  });

  React.useEffect(() => {
    const { currentPage, currentPageSize, currentQuery } = localPagination;

    LookupTablesActions.searchPaginated(currentPage, currentPageSize, currentQuery)
      .then(() => setLoading(false));
  }, [localPagination]);

  const onPageChange = React.useCallback((newPage: number, newPerPage: number) => {
    setLocalPagination({ ...localPagination, currentPage: newPage, currentPageSize: newPerPage });
  }, [localPagination]);

  const onSearch = React.useCallback((query: string) => {
    localPagination.resetPage();
    localPagination.setPagination({ page: 1, pageSize: localPagination.currentPageSize });
    setLocalPagination({ ...localPagination, currentPage: 1, currentQuery: query });
  }, [localPagination]);

  const onReset = React.useCallback(() => {
    localPagination.resetPage();
    localPagination.setPagination({ page: 1, pageSize: localPagination.currentPageSize });
    setLocalPagination({ ...localPagination, currentPage: 1, currentQuery: '' });
  }, [localPagination]);

  const getComponent = () => {
    switch (true) {
      case loading:
        return <Spinner text="Loading tables" />;
      case (tables.length === 0 && !!localPagination.currentQuery):
        return (
          <tbody>
            <tr>
              <td colSpan={6}>
                <NoSearchResult>No tables found with title &quot;{localPagination.currentQuery}&quot;</NoSearchResult>
              </td>
            </tr>
          </tbody>
        );
      case tables.length > 0:
        return tables.map((table: LookupTable) => (
          <LUTItem key={`table-item-${table.id}`}
                   table={table}
                   caches={caches}
                   dataAdapters={dataAdapters}
                   errorStates={errorStates} />
        ));
      default:
        return (
          <tbody>
            <tr>
              <td colSpan={6}>
                <NoEntitiesExist>There are no tables to list</NoEntitiesExist>
              </td>
            </tr>
          </tbody>
        );
    }
  };

  return (
    <Row className="content">
      <Col md={12}>
        <h2 style={{ marginBottom: 16 }}>
          Configured lookup tables <small>{pagination.total} total</small>
        </h2>
        <PaginatedList activePage={localPagination.currentPage}
                       pageSize={localPagination.currentPageSize}
                       onChange={onPageChange}
                       totalItems={pagination.total}>
          <SearchForm query={localPagination.currentQuery} onSearch={onSearch} onReset={onReset}>
            <OverlayTrigger trigger="click" rootClose placement="right" overlay={buildHelpPopover()}>
              <Button bsStyle="link" className={Styles.searchHelpButton}><Icon name="question-circle" fixedWidth /></Button>
            </OverlayTrigger>
          </SearchForm>
          <div style={{ overflowX: 'auto' }}>
            <Table condensed hover className={Styles.overviewTable}>
              <thead>
                <tr>
                  <th className={Styles.rowTitle}>Title</th>
                  <th className={Styles.rowDescription}>Description</th>
                  <th className={Styles.rowName}>Name</th>
                  <th className={Styles.rowCache}>Cache</th>
                  <th className={Styles.rowAdapter}>Data Adapter</th>
                  <th className={Styles.rowActions}>Actions</th>
                </tr>
              </thead>
              {getComponent()}
            </Table>
          </div>
        </PaginatedList>
      </Col>
    </Row>
  );
};

export default withPaginationQueryParameter(LookupTablesOverview);
