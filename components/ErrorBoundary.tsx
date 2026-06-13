import React from 'react';
import { View, Text } from 'react-native';

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.log('SCREEN CRASH ERROR:', error);
    console.log('SCREEN CRASH INFO:', info);
  }

  render() {
    const { error } = this.state;

    if (error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <Text style={{ fontWeight: '700', fontSize: 18 }}>
            App bị lỗi ở screen
          </Text>

          <Text style={{ marginTop: 12 }}>
            {error.message}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}