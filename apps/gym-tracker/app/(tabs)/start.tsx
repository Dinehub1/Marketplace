import { Redirect } from 'expo-router';

/** Never shown: the tab bar's Start button starts or resumes a workout instead of opening this tab. */
export default function Start() {
  return <Redirect href="/" />;
}
