import { ThemeProvider } from './features/jobApplications/theme/ThemeProvider';
import { LanguageProvider } from './features/jobApplications/i18n/LanguageProvider';
import { JobApplicationTracker } from './features/jobApplications';

const App = () => (
  <ThemeProvider>
    <LanguageProvider>
      <JobApplicationTracker />
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
