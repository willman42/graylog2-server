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

import React, { useCallback, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

import { Link } from 'components/common/router';
import { useStore } from 'stores/connect';
import { ViewActions, ViewStore } from 'views/stores/ViewStore';
import { Icon } from 'components/common';
import { Row } from 'components/bootstrap';
import ViewPropertiesModal from 'views/components/dashboard/DashboardPropertiesModal';
import onSaveView from 'views/logic/views/OnSaveViewAction';
import View from 'views/logic/views/View';
import Routes from 'routing/Routes';
import viewTitle from 'views/logic/views/ViewTitle';
import FavoriteIcon from 'views/components/FavoriteIcon';
import useIsEventDefinitionReplaySearch from 'hooks/useIsEventDefinitionReplaySearch';

const links = {
  [View.Type.Dashboard]: ({ id, title }) => [{
    link: Routes.DASHBOARDS,
    label: 'Dashboards',
  },
  {
    label: title || id,
  },
  ],
  [View.Type.Search]: ({ id, title }) => [{
    link: Routes.SEARCH,
    label: 'Search',
  },
  {
    label: title || id,
  },
  ],
  alert: ({ id }) => {
    return [
      {
        link: Routes.ALERTS.LIST,
        label: 'Alerts & Events',
      },
      {
        label: id,
      },
    ];
  },
  eventDefinition: ({ id, title }) => {
    return [
      {
        link: Routes.ALERTS.DEFINITIONS.LIST,
        label: 'Event definitions',
      },
      {
        link: Routes.ALERTS.DEFINITIONS.show(id),
        label: title || id,
      },
    ];
  },
};

const Content = styled.div(({ theme }) => css`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  margin-bottom: ${theme.spacings.xs};
  gap: 4px;
`);

const EditButton = styled.div(({ theme }) => css`
  color: ${theme.colors.gray[60]};
  font-size: ${theme.fonts.size.tiny};
  cursor: pointer;
`);

const TitleWrapper = styled.span`
  display: flex;
  gap: 4px;
  align-items: center;

  & ${EditButton} {
    display: none;
  }

  &:hover ${EditButton} {
    display: block;
  }
`;

const StyledIcon = styled(Icon)`
font-size: 0.50rem;
`;

const CrumbLink = ({ label, link }: { label: string, link: string | undefined}) => (
  link ? <Link target="_blank" to={link}>{label}</Link> : <span>{label}</span>
);

const ViewHeader = () => {
  const { view } = useStore(ViewStore);
  const isSavedView = view?.id && view?.title;
  const [showMetadataEdit, setShowMetadataEdit] = useState<boolean>(false);
  const toggleMetadataEdit = useCallback(() => setShowMetadataEdit((cur) => !cur), [setShowMetadataEdit]);
  const { alertId, definitionId, definitionTitle, isAlert, isEventDefinition, isEvent } = useIsEventDefinitionReplaySearch();
  const typeText = view.type.toLocaleLowerCase();
  const title = viewTitle(view.title, view.type);
  const onChangeFavorite = useCallback((newValue) => {
    ViewActions.update(view.toBuilder().favorite(newValue).build());
  }, [view]);

  const breadCrumbs = useMemo(() => {
    if (isAlert || isEvent) return links.alert({ id: alertId });
    if (isEventDefinition) return links.eventDefinition({ id: definitionId, title: definitionTitle });

    return links[view.type]({ id: view.id, title });
  }, [alertId, definitionId, definitionTitle, isAlert, isEvent, isEventDefinition, view, title]);

  return (
    <Row>
      <Content>
        {
          breadCrumbs.map(({ label, link }, index) => {
            if (index === breadCrumbs.length - 1) {
              return (
                <TitleWrapper>
                  <CrumbLink link={link} label={label} />
                  {isSavedView && (
                  <>
                    <FavoriteIcon isFavorite={view.favorite} id={view.id} onChange={onChangeFavorite} />
                    <EditButton onClick={toggleMetadataEdit}
                                role="button"
                                title={`Edit ${typeText} ${view.title} metadata`}
                                tabIndex={0}>
                      <Icon name="pen-to-square" />
                    </EditButton>
                  </>
                  )}
                </TitleWrapper>
              );
            }

            return <><CrumbLink label={label} link={link} /><StyledIcon name="chevron-right" /></>;
          })
        }
        {showMetadataEdit && (
        <ViewPropertiesModal show
                             view={view}
                             title={`Editing saved ${typeText}`}
                             onClose={toggleMetadataEdit}
                             onSave={onSaveView}
                             submitButtonText={`Save ${typeText}`} />
        )}
      </Content>
    </Row>
  );
};

export default ViewHeader;
