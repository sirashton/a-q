// Manual testing script - run this in browser console to verify functionality
// Open browser console and paste this code

import { adviceService } from '../services/adviceService';
import { storageService } from '../services/storageService';

const runTests = async () => {
  console.log('🧪 Starting manual tests...');
  
  try {
    // Test 1: Load all advices
    console.log('Test 1: Loading all advices...');
    const allAdvices = await adviceService.getAllAdvices('nz');
    console.log(`✅ Loaded ${allAdvices.length} advices`);
    
    // Test 2: Load sections
    console.log('Test 2: Loading sections...');
    const sections = await adviceService.getSections('nz');
    console.log(`✅ Loaded ${sections.length} sections:`, sections.map(s => s.id));
    
    // Test 3: Get daily advice
    console.log('Test 3: Getting daily advice...');
    const dailyAdvice = await adviceService.getDailyAdvice();
    console.log('✅ Daily advice:', dailyAdvice?.id, dailyAdvice?.text?.substring(0, 50) + '...');
    
    // Test 4: Search functionality
    console.log('Test 4: Testing search...');
    const searchResults = await adviceService.searchAdvices('love', 'nz');
    console.log(`✅ Found ${searchResults.length} advices containing "love"`);
    
    // Test 5: Storage service
    console.log('Test 5: Testing storage...');
    await storageService.initialize();
    const prefs = await storageService.getPreferences();
    console.log('✅ Storage initialized:', prefs.selectedCountry);
    
    // Test 6: Disable/Enable advice
    console.log('Test 6: Testing disable/enable...');
    const firstAdvice = allAdvices[0];
    await adviceService.disableAdvice(firstAdvice.id);
    const isDisabled = await adviceService.isAdviceDisabled(firstAdvice.id);
    console.log(`✅ Disabled advice ${firstAdvice.id}:`, isDisabled);
    
    await adviceService.enableAdvice(firstAdvice.id);
    const isEnabled = !(await adviceService.isAdviceDisabled(firstAdvice.id));
    console.log(`✅ Re-enabled advice ${firstAdvice.id}:`, isEnabled);
    
    // Test 7: Statistics
    console.log('Test 7: Getting statistics...');
    const stats = await adviceService.getAdviceStats('nz');
    console.log('✅ Statistics:', stats);
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the tests
runTests();
