import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import React, { useMemo, useRef, useState } from 'react';
import { sin } from './AnimatedMath';
// import { EasingNode } from 'react-native-reanimated';

const Value = Animated.createAnimatedComponent(Text);



export interface WheelStyleProps {
  containerStyle?: ViewStyle;
  itemHeight?: number;
  itemGap?: number;
  showIcon?: boolean;
  selectedColor?: string;
  disabledColor?: string;
  textStyle?: TextStyle;
  wheelHeight?: number;
  displayCount?: number;
  type?: string
}


export interface WheelProps<T> extends WheelStyleProps {
  value: T;
  setValue: (value: T) => void;
  values: T[];
  onScroll?: (scrollState: boolean) => void;
}

export default function Wheel<T>({
  value,
  setValue,
  onScroll,
  values,
  containerStyle,
  textStyle,
  itemHeight = 15,
  selectedColor = 'black',
  disabledColor = 'gray',
  wheelHeight,
  displayCount = 5,
  type
}: WheelProps<T>): React.ReactElement {
  const translateY = useRef(new Animated.Value(0));
  const renderCount =
    displayCount * 2 < values.length
      ? displayCount * 4 + 1
      : displayCount * 2 - 1;
  const circular = values.length >= displayCount;
  const [height, setHeight] = useState(
    typeof containerStyle?.height === 'number' ? containerStyle.height : 100
  );
  const radius = wheelHeight != null ? wheelHeight / 2 : height / 2;

  const valueIndex = useMemo(() => values.indexOf(value), [values, value]);

  const panResponder = React.useMemo(() => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        translateY.current.setValue(0);
        onScroll && onScroll(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        translateY.current.setValue(gestureState.dy);
        evt.stopPropagation();
      },
      onPanResponderRelease: (_, gestureState) => {
        onScroll && onScroll(false);
        translateY.current.extractOffset();
        let newValueIndex =
          valueIndex -
          Math.round(gestureState.dy / ((radius * 2) / displayCount));
        if (circular)
          newValueIndex = (newValueIndex + values.length) % values.length;
        else {
          if (newValueIndex < 0) newValueIndex = 0;
          else if (newValueIndex >= values.length)
            newValueIndex = values.length - 1;
        }
        const newValue = values[newValueIndex];
        if (newValue === value) {
          translateY.current.setOffset(0);

          translateY.current.setValue(0);
        } else setValue(newValue);
      },
    });
  }, [
    circular,
    displayCount,
    onScroll,
    radius,
    setValue,
    value,
    valueIndex,
    values,
  ]);

  const displayValues = useMemo(() => {
    const centerIndex = Math.floor(renderCount / 2);

    return new Array(renderCount).fill(undefined).map((_, index) => {
      let targetIndex = valueIndex + index - centerIndex;
      if (targetIndex < 0 || targetIndex >= values.length) {
        if (!circular) {
          return null;
        }
        targetIndex = (targetIndex + values.length) % values.length;
      }
      return values[targetIndex];
    });
  }, [renderCount, valueIndex, values, circular]);

  const animatedAngles = useMemo(() => {
    translateY.current.setValue(0);
    translateY.current.setOffset(0);
    const currentIndex = displayValues.indexOf(value);
    return displayValues.map((_, index) =>
      translateY.current
        .interpolate({
          inputRange: [-radius, radius],
          outputRange: [
            -radius + ((radius * 2) / displayCount) * (index - currentIndex),
            radius + ((radius * 2) / displayCount) * (index - currentIndex),
          ],
          // easing: EasingNode.circle,
          extrapolate: 'extend',
        })
        .interpolate({
          inputRange: [-radius, radius],
          outputRange: [-Math.PI / 2, Math.PI / 2],
          // easing: EasingNode.circle,
          extrapolate: 'clamp',
        })
    );
  }, [displayValues, radius, value, displayCount]);

  return (
    <View
      style={{ ...styles.container, ...containerStyle, marginLeft: type === "daytime" ? 0 : 10 }}
      onLayout={(evt) => setHeight(evt.nativeEvent.layout.height)}
      {...panResponder.panHandlers}
    >
      {displayValues.map((displayValue: T | null, index: number) => {
        const animatedAngle = animatedAngles[index];
        return (
          <Value
            style={[
              // eslint-disable-next-line react-native/no-inline-styles
              {
                position: 'absolute',
                height: itemHeight,
                transform: [
                  {
                    translateY: Animated.multiply(radius, sin(animatedAngle)),
                  },
                  {
                    rotateX: animatedAngle.interpolate({
                      inputRange: [-Math.PI / 2.7, Math.PI / 3],
                      outputRange: ['-90deg', '90deg'],
                      // easing: EasingNode.cicle,
                      extrapolate: 'clamp',
                    }),
                  },
                ],
                color: displayValue === value ? selectedColor : disabledColor,
                ...textStyle,
              },
            ]}
            key={`${value}${index > displayValues.length / 2 ? 'Post' : 'Before'
              }${displayValue ?? 'null' + index}`}
          >
            {displayValue}
          </Value>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: 50,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  contentContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
