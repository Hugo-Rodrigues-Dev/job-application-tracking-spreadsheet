import { LanguageProvider } from './features/jobApplications/i18n/LanguageProvider';
import { JobApplicationTracker } from './features/jobApplications';

const App = () => (
  <LanguageProvider>
    <JobApplicationTracker />
  </LanguageProvider>
);

export default App;
