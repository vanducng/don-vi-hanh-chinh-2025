# /// script
# dependencies = [
#     "selenium>=4.15.0",
#     "webdriver-manager>=4.0.0",
# ]
# ///

import csv
import logging
import time
from typing import List, Optional, Tuple

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.common.exceptions import WebDriverException
from webdriver_manager.chrome import ChromeDriverManager

class VnExpressCrawler:
    """Web crawler for VnExpress administrative restructuring data."""
    
    def __init__(
        self, 
        base_url: str, 
        output_file: str = "data.csv", 
        log_file: str = "crawl.log"
    ):
        self.base_url = base_url
        self.output_file = output_file
        self.log_file = log_file
        self.driver = None
        self.total_rows = 0
        self.max_retries = 5
        
        self.setup_logging()
        self.setup_driver()
        
    def setup_logging(self) -> None:
        """Setup logging configuration."""
        # Remove existing handlers to avoid duplicates
        for handler in logging.root.handlers[:]:
            logging.root.removeHandler(handler)
            
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.log_file, mode='w', encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        self.logger.info("=== VnExpress Crawler Started ===")
        
    def setup_driver(self) -> None:
        """Setup Chrome driver with optimized options."""
        try:
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument(
                "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36"
            )
            
            self.driver = webdriver.Chrome(
                service=Service(ChromeDriverManager().install()), 
                options=chrome_options
            )
            self.driver.set_page_load_timeout(120)
            self.logger.info("Chrome driver initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Chrome driver: {e}")
            raise
    
    def load_page_with_retry(self) -> bool:
        """Load the main page with retry logic."""
        for attempt in range(self.max_retries):
            try:
                self.logger.info(
                    f"Loading page (attempt {attempt + 1}/{self.max_retries}): "
                    f"{self.base_url}"
                )
                self.driver.get(self.base_url)
                
                # Wait for page and Flourish embeds to load
                self.logger.info("Waiting for page content to load...")
                time.sleep(15)
                
                return True
                
            except Exception as e:
                self.logger.warning(f"Attempt {attempt + 1} failed: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    
        self.logger.error("Failed to load page after all retry attempts")
        return False
    
    def find_data_embed(self) -> Optional[object]:
        """Find and validate the correct Flourish embed containing data."""
        try:
            flourish_embeds = self.driver.find_elements(
                By.CSS_SELECTOR, ".flourish-embed"
            )
            self.logger.info(f"Found {len(flourish_embeds)} Flourish embeds")
            
            if len(flourish_embeds) == 0:
                self.logger.error("No Flourish embeds found")
                return None
            
            # Test embeds to find the one with data
            for i, embed in enumerate(flourish_embeds):
                if self.test_embed_for_data(embed):
                    self.logger.info(f"Found data in embed index {i}")
                    return embed
            
            self.logger.error("No embed contains table data")
            return None
            
        except Exception as e:
            self.logger.error(f"Error finding data embed: {e}")
            return None
    
    def test_embed_for_data(self, embed) -> bool:
        """Test if an embed contains table data."""
        try:
            iframes = embed.find_elements(By.TAG_NAME, "iframe")
            if not iframes:
                return False
            
            # Test the first iframe
            self.driver.switch_to.frame(iframes[0])
            
            # Look for tables with data
            tables = self.driver.find_elements(By.TAG_NAME, "table")
            has_data = False
            
            if tables:
                table = tables[0]
                rows = table.find_elements(By.TAG_NAME, "tr")
                data_rows = 0
                
                # Check first few rows for actual data
                for row in rows[:5]:
                    cells = row.find_elements(By.TAG_NAME, "td")
                    if len(cells) >= 3:
                        col1 = cells[0].text.strip()
                        col2 = cells[1].text.strip()
                        col3 = cells[2].text.strip()
                        if col1 and col2 and col3:
                            data_rows += 1
                
                has_data = data_rows > 0
                self.logger.debug(
                    f"Embed test: {len(tables)} tables, {data_rows} data rows"
                )
            
            self.driver.switch_to.default_content()
            return has_data
            
        except Exception as e:
            self.logger.debug(f"Error testing embed: {e}")
            self.driver.switch_to.default_content()
            return False
    
    def navigate_to_iframe(self, embed) -> bool:
        """Navigate to the iframe within the data embed."""
        try:
            iframes = embed.find_elements(By.TAG_NAME, "iframe")
            if not iframes:
                self.logger.error("No iframes found in data embed")
                return False
            
            self.driver.switch_to.frame(iframes[0])
            self.logger.info("Successfully switched to iframe")
            time.sleep(5)  # Wait for iframe content to load
            return True
            
        except Exception as e:
            self.logger.error(f"Error navigating to iframe: {e}")
            return False
    
    def extract_current_page_data(self) -> List[Tuple[str, str, str]]:
        """Extract data from the current page in the iframe."""
        data = []
        
        try:
            tables = self.driver.find_elements(By.TAG_NAME, "table")
            if not tables:
                self.logger.warning("No tables found on current page")
                return data
            
            table = tables[0]
            rows = table.find_elements(By.TAG_NAME, "tr")
            self.logger.debug(f"Processing {len(rows)} rows")
            
            for row in rows:
                cells = row.find_elements(By.TAG_NAME, "td")
                if len(cells) >= 3:
                    col1 = cells[0].text.strip()
                    col2 = cells[1].text.strip()
                    col3 = cells[2].text.strip()
                    
                    # Skip header rows and empty data
                    if col1 and col2 and col3 and not col1.startswith("Tỉnh"):
                        data.append((col1, col2, col3))
                        
        except Exception as e:
            self.logger.error(f"Error extracting current page data: {e}")
        
        return data
    
    def go_to_next_page(self) -> bool:
        """Navigate to the next page using JavaScript click."""
        for attempt in range(self.max_retries):
            try:
                # Look for next button
                next_button = None
                next_selectors = [
                    "button.next",
                    "button[aria-label='Next page']",
                    "button[title='Next page']"
                ]
                
                for selector in next_selectors:
                    buttons = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for button in buttons:
                        if button.is_enabled() and button.is_displayed():
                            next_button = button
                            self.logger.debug(
                                f"Found next button with selector: {selector}"
                            )
                            break
                    if next_button:
                        break
                
                if not next_button:
                    self.logger.info("No next page button found - reached end")
                    return False
                
                # Use JavaScript click (most reliable method)
                self.logger.debug("Clicking next page button with JavaScript...")
                self.driver.execute_script("arguments[0].click();", next_button)
                time.sleep(3)  # Wait for page to load
                
                return True
                
            except Exception as e:
                self.logger.warning(f"Next page attempt {attempt + 1} failed: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(1)
        
        self.logger.error("Failed to navigate to next page after all attempts")
        return False
    
    def save_progress_to_csv(self, all_data: List[Tuple[str, str, str]]) -> None:
        """Save all collected data to CSV."""
        if not all_data:
            return
            
        try:
            with open(self.output_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    "Tỉnh", 
                    "Phường, xã mới", 
                    "Phường, xã trước sáp nhập"
                ])
                writer.writerows(all_data)
            
            self.total_rows = len(all_data)
            self.logger.info(f"Progress saved: {self.total_rows} total rows")
            
        except Exception as e:
            self.logger.error(f"Error saving progress: {e}")
    
    def crawl_all_data(self) -> List[Tuple[str, str, str]]:
        """Main crawling method."""
        all_data = []
        
        try:
            # Load main page
            if not self.load_page_with_retry():
                return all_data
            
            # Find and navigate to data embed
            data_embed = self.find_data_embed()
            if not data_embed:
                return all_data
            
            if not self.navigate_to_iframe(data_embed):
                return all_data
            
            # Process all pages
            current_page = 1
            consecutive_empty_pages = 0
            max_empty_pages = 5
            max_pages = 350  # Safety limit
            
            while current_page <= max_pages:
                self.logger.info(f"Processing page {current_page}")
                
                # Extract data from current page
                page_data = self.extract_current_page_data()
                
                if page_data:
                    all_data.extend(page_data)
                    consecutive_empty_pages = 0
                    self.logger.info(
                        f"Extracted {len(page_data)} rows from page {current_page} "
                        f"(Total: {len(all_data)})"
                    )
                    
                    # Save progress after each page
                    self.save_progress_to_csv(all_data)
                else:
                    consecutive_empty_pages += 1
                    self.logger.warning(
                        f"No data found on page {current_page} "
                        f"({consecutive_empty_pages} consecutive empty)"
                    )
                    
                    if consecutive_empty_pages >= max_empty_pages:
                        self.logger.info(
                            f"Stopping after {max_empty_pages} consecutive empty pages"
                        )
                        break
                
                # Try to go to next page
                if not self.go_to_next_page():
                    self.logger.info("Reached the last page")
                    break
                    
                current_page += 1
                time.sleep(2)  # Delay between pages
            
            # Switch back to main content
            self.driver.switch_to.default_content()
            
        except KeyboardInterrupt:
            self.logger.info("Crawling interrupted by user")
        except Exception as e:
            self.logger.error(f"Error during crawling: {e}")
        finally:
            if self.driver:
                self.driver.quit()
                self.logger.info("Chrome driver closed")
        
        return all_data
    
    def run(self) -> None:
        """Run the crawler and report results."""
        self.logger.info("Starting VnExpress administrative data crawler")
        
        all_data = self.crawl_all_data()
        
        if all_data:
            self.save_progress_to_csv(all_data)
            self.logger.info(f"Crawling completed successfully!")
            self.logger.info(f"Total rows extracted: {len(all_data)}")
            self.logger.info(f"Data saved to: {self.output_file}")
            print(f"\n🎉 Success! Extracted {len(all_data)} rows")
            print(f"📄 Data saved to: {self.output_file}")
            print(f"📋 Log saved to: {self.log_file}")
        else:
            self.logger.error("No data was extracted")
            print("❌ No data was extracted. Check the log file for details.")

def main() -> None:
    """Main function."""
    base_url = "https://vnexpress.net/tra-cuu-3-321-phuong-xa-tren-ca-nuoc-sau-sap-xep-4903454.html"
    output_file = "data.csv"
    log_file = "crawl.log"
    
    crawler = VnExpressCrawler(base_url, output_file, log_file)
    crawler.run()

if __name__ == "__main__":
    main()