// @flow strict
import * as React from 'react';
import styled, { css, withTheme, type StyledComponent } from 'styled-components';

import { Icon } from 'components/common';
import { themePropTypes, type ThemeInterface } from 'theme';
import {
  THEME_MODE_LIGHT,
  THEME_MODE_DARK,
} from 'theme/constants';

type Props = {
  theme: ThemeInterface,
};

const ThemeModeToggleWrap: StyledComponent<{}, void, HTMLDivElement> = styled.div`
  display: flex;
  align-items: center;
`;

const ModeIcon: StyledComponent<{currentMode: boolean}, ThemeInterface, typeof Icon> = styled(({ currentMode, theme, ...props }) => <Icon {...props} />)`
  opacity: ${({ currentMode }) => (currentMode ? '1' : '0.5')};
  color: ${({ currentMode, theme }) => (currentMode ? theme.colors.brand.primary : theme.colors.variant.default)};
`;

const Toggle: StyledComponent<{}, ThemeInterface, HTMLLabelElement> = styled.label(({ theme }) => css`
  display: flex;
  align-items: center;
  margin: 0;

  input {
    border: 0;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute;
    width: 1px;
    white-space: nowrap;

    &:checked + .slider {
      background-color: ${theme.colors.variant.light.info};

      &::before {
        transform: translate(16px, -50%);
      }
    }

    &:disabled + .slider {
      opacity: 0.5;
      cursor: not-allowed;

      &::before {
        background-color: ${theme.colors.gray[80]};
      }
    }
  }

  .slider {
    box-sizing: border-box;
    margin: 0 9px;
    width: 36px;
    height: 22px;
    border-radius: 30px;
    background-color: ${theme.colors.gray[80]};
    box-shadow: inset 0 1px 3px 0 rgba(0, 0, 0, 0.2);
    display: inline-block;
    position: relative;
    cursor: pointer;

    &::before {
      transition: transform 75ms ease-in-out;
      content: '';
      display: block;
      width: 18px;
      height: 18px;
      background-color: #fff;
      box-shadow: 0 2px 3px 0 rgba(0, 0, 0, 0.25), 0 2px 8px 0 rgba(32, 37, 50, 0.16);
      position: absolute;
      border-radius: 100%;
      top: 11px;
      transform: translate(2px, -50%);
    }
  }
`);

const ThemeModeToggle = ({ theme }: Props) => {
  const toggleThemeMode = (event) => {
    const nextMode = event.target.checked ? THEME_MODE_DARK : THEME_MODE_LIGHT;

    theme.changeMode(nextMode);
  };

  return (
    <ThemeModeToggleWrap>
      <ModeIcon name="sun" currentMode={theme.mode === THEME_MODE_LIGHT} />
      <Toggle>
        <input value={THEME_MODE_DARK}
               type="checkbox"
               onChange={toggleThemeMode}
               checked={theme.mode === THEME_MODE_DARK} />
        <span className="slider" />
      </Toggle>
      <ModeIcon name="moon" currentMode={theme.mode === THEME_MODE_DARK} />
    </ThemeModeToggleWrap>
  );
};

ThemeModeToggle.propTypes = {
  theme: themePropTypes.isRequired,
};

export default withTheme(ThemeModeToggle);
