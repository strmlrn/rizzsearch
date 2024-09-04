document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resultsDiv = document.getElementById('results');
    const welcomeMessage = document.getElementById('welcome-message');
    const recentSearchesList = document.getElementById('recent-searches');
    const viewAllSearchesButton = document.getElementById('view-all-searches');
    const modal = document.getElementById('recent-searches-modal');
    const closeModal = document.getElementsByClassName('close')[0];
    const allRecentSearchesList = document.getElementById('all-recent-searches');
    const backToTopButton = document.getElementById('back-to-top');

    let allResults = [];
    let currentPage = 1;
    const resultsPerPage = 10;

    const welcomeText = "Welcome to ExamRizz Search!";
    let i = 0;

    function typeWriter() {
        if (i < welcomeText.length) {
            welcomeMessage.innerHTML += welcomeText.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    }

    typeWriter();

    let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

    function updateRecentSearches() {
        recentSearchesList.innerHTML = '';
        const displaySearches = recentSearches.slice(0, 5);
        displaySearches.forEach(search => {
            const li = document.createElement('li');
            li.textContent = search;
            li.addEventListener('click', () => {
                searchInput.value = search;
                performSearch();
            });
            recentSearchesList.appendChild(li);
        });
    }

    function updateAllRecentSearches() {
        allRecentSearchesList.innerHTML = '';
        recentSearches.forEach(search => {
            const li = document.createElement('li');
            li.textContent = search;
            allRecentSearchesList.appendChild(li);
        });
    }

    function addToRecentSearches(query) {
        const index = recentSearches.indexOf(query);
        if (index > -1) {
            recentSearches.splice(index, 1);
        }
        recentSearches.unshift(query);
        if (recentSearches.length > 20) {
            recentSearches.pop();
        }
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
        updateRecentSearches();
    }

    updateRecentSearches();

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    viewAllSearchesButton.addEventListener('click', function() {
        updateAllRecentSearches();
        modal.style.display = "block";
    });

    closeModal.addEventListener('click', function() {
        modal.style.display = "none";
    });

    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });

    function performSearch() {
        const query = searchInput.value;
        resultsDiv.innerHTML = '<div class="spinner"></div>';

        addToRecentSearches(query);

        fetch(`/api/search?q=${encodeURIComponent(query)}`)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => { throw new Error(text) })
                }
                return response.json();
            })
            .then(results => {
                allResults = results;
                currentPage = 1;
                displayResults();
            })
            .catch(error => {
                console.error('Error:', error);
                resultsDiv.innerHTML = `<p>An error occurred while searching: ${error.message}</p>`;
            });
    }

    function displayResults() {
        resultsDiv.innerHTML = '';
        if (allResults.length === 0) {
            resultsDiv.innerHTML = '<p>No results found.</p>';
            return;
        }

        const startIndex = (currentPage - 1) * resultsPerPage;
        const endIndex = Math.min(startIndex + resultsPerPage, allResults.length);
        const pageResults = allResults.slice(startIndex, endIndex);
        
        pageResults.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-card';
            resultItem.innerHTML = `
                <h2>Question ${result.question_number}</h2>
                <p><strong>Type:</strong> ${result.question_type}</p>
                <p><strong>Year:</strong> ${result.year}</p>
                <p><strong>Question:</strong> ${result.question_text}</p>
                <p><strong>Category:</strong> ${result.category}</p>
                <div class="result-buttons">
                    ${result.image_available ? '<button class="view-image">View Image</button>' : ''}
                    ${result.video_solution_available ? '<button class="view-video">View Video Solution</button>' : ''}
                    ${result.answer ? '<button class="view-answer">View Answer</button>' : ''}
                </div>
                <div class="answer" style="display: none;">
                    <p><strong>Answer:</strong> ${result.answer}</p>
                </div>
            `;

            const imageButton = resultItem.querySelector('.view-image');
            if (imageButton) {
                imageButton.addEventListener('click', () => viewImage(result.id));
            }

            const videoButton = resultItem.querySelector('.view-video');
            if (videoButton) {
                videoButton.addEventListener('click', () => viewVideo(result.id));
            }

            const answerButton = resultItem.querySelector('.view-answer');
            if (answerButton) {
                answerButton.addEventListener('click', () => viewAnswer(resultItem));
            }

            resultsDiv.appendChild(resultItem);
        });

        if (endIndex < allResults.length) {
            const loadMoreButton = document.createElement('button');
            loadMoreButton.textContent = 'Load More';
            loadMoreButton.className = 'load-more-button';
            loadMoreButton.addEventListener('click', () => {
                currentPage++;
                displayResults();
            });
            resultsDiv.appendChild(loadMoreButton);
        }
    }

    function viewImage(questionId) {
        console.log(`Viewing image for question ${questionId}`);
        // Implement image viewing functionality
    }

    function viewVideo(questionId) {
        console.log(`Viewing video for question ${questionId}`);
        // Implement video viewing functionality
    }

    function viewAnswer(resultItem) {
        const answerDiv = resultItem.querySelector('.answer');
        const answerButton = resultItem.querySelector('.view-answer');
        if (answerDiv.style.display === 'none') {
            answerDiv.style.display = 'block';
            answerButton.textContent = 'Hide Answer';
        } else {
            answerDiv.style.display = 'none';
            answerButton.textContent = 'View Answer';
        }
    }

    // Infinite scroll
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            const loadMoreButton = document.querySelector('.load-more-button');
            if (loadMoreButton) {
                loadMoreButton.click();
            }
        }
    });

    // Back to top button
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'flex';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Implement debounce for search input
    function debounce(func, delay) {
        let debounceTimer;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        }
    }

    const debouncedSearch = debounce(performSearch, 300);
    searchInput.addEventListener('input', debouncedSearch);
});