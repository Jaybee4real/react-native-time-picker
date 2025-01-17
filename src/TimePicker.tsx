import React, { useCallback, useMemo, useState } from 'react';
/* eslint-disable radix */
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Wheel, { WheelStyleProps } from './Wheel';

const MILLISECONDS_PER_MINUTE = 60 * 1000;
const MILLISECONDS_PER_HOUR = MILLISECONDS_PER_MINUTE * 60;
const MILLISECONDS_PER_DAY = MILLISECONDS_PER_HOUR * 24;



function createNumberList(num: number) {
  return new Array(num)
    .fill(0)
    .map((_, index) => (index < 10 ? `0${index}` : `${index}`));
}

const TWENTY_FOUR_LIST = createNumberList(24);
const TWELVE_LIST = new Array(12)
  .fill(0)
  .map((_, index) => (index + 1 < 10 ? `0${index + 1}` : `${index + 1}`));
const SIXTY_LIST = createNumberList(60);

interface Props {
  value?: number | null; // milliseconds of date
  onChange: (value: number) => void;
  containerStyle?: StyleProp<ViewStyle>;
  onScroll?: (scrollState: boolean) => void;
  textStyle?: TextStyle;
  wheelProps?: WheelStyleProps;
  use24HourSystem?: boolean;
  showSeconds?: boolean;
  showIcon?: boolean
}

export default function TimePicker({
  value,
  onChange,
  onScroll,
  containerStyle,
  textStyle,
  wheelProps = {},
  use24HourSystem,
  showSeconds,
}: Props): React.ReactElement {
  const [current, setCurrent] = useState(
    (value ?? Date.now()) % MILLISECONDS_PER_DAY
  );
  const [hour, setHour] = useState(Math.floor(current / MILLISECONDS_PER_HOUR));
  const [minute, setMinute] = useState(
    Math.floor(current / MILLISECONDS_PER_MINUTE) % 60
  );
  const [second, setSecond] = useState(Math.floor(current / 1000) % 60);

  const changeTimeValue = useCallback(
    (type: 'hour' | 'minute' | 'second', newValue: number) => {
      let newHour = hour;
      let newMinute = minute;
      let newSecond = second;
      switch (type) {
        case 'hour':
          setHour(newValue);
          newHour = newValue;
          break;
        case 'minute':
          setMinute(newValue);
          newMinute = newValue;
          break;
        case 'second':
          setSecond(newValue);
          newSecond = newValue;
          break;
      }
      const newCurrent =
        newHour * MILLISECONDS_PER_HOUR +
        newMinute * MILLISECONDS_PER_MINUTE +
        newSecond * 1000;
      setCurrent(newCurrent);
      onChange && onChange(newCurrent);
    },
    [hour, minute, onChange, second]
  );

  const displayHourValue = useMemo(() => {
    let displayHour = use24HourSystem ? hour : hour % 12;
    if (!use24HourSystem && displayHour === 0) displayHour = 12;
    return displayHour < 10 ? `0${displayHour}` : `${displayHour}`;
  }, [hour, use24HourSystem]);
  return (
    <View style={[styles.container, containerStyle]}>
      <Wheel
        key={'hour'}
        value={displayHourValue}
        values={use24HourSystem ? TWENTY_FOUR_LIST : TWELVE_LIST}
        setValue={(newValue) => {
          changeTimeValue(
            'hour',
            (parseInt(newValue) % 12) + (hour >= 12 ? 12 : 0)
          );
        }}
        onScroll={onScroll}
        textStyle={textStyle}
        {...wheelProps}
      />
      <Text style={{ ...styles.divider, ...textStyle }}>:</Text>
      <Wheel
        key={'min'}
        value={minute < 10 ? `0${minute}` : `${minute}`}
        values={SIXTY_LIST}
        setValue={(newValue) => changeTimeValue('minute', parseInt(newValue))}
        onScroll={onScroll}
        textStyle={{...textStyle}}
        {...wheelProps}
      />
      {!use24HourSystem && (
        <Wheel
          key={'am/pm'}
          type="daytime"
          value={hour <= 12 ? 'am' : 'pm'}
          values={['am', 'pm']}
          setValue={(newValue) => {
            changeTimeValue('hour', (hour % 12) + (newValue === 'pm' ? 12 : 0));
          }}
          onScroll={onScroll}
          {...wheelProps}
          textStyle={{ ...textStyle, fontSize: 18, fontWeight: "600", paddingTop: 2 }}
        />
      )}
      {showSeconds && (
        <>
          <Text style={textStyle}>:</Text>
          <Wheel
            key={'sec'}
            value={second < 10 ? `0${second}` : `${second}`}
            values={SIXTY_LIST}
            setValue={(newValue) =>
              changeTimeValue('second', parseInt(newValue))
            }
            onScroll={onScroll}
            textStyle={{ ...textStyle, fontSize: 15 }}
            {...wheelProps}
          />
        </>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
    height: 100,
    overflow: 'hidden',
    borderRadius: 4,
  },
  divider: {
    color: "white", fontWeight: "700", marginBottom: 10,
  },
})
