document.addEventListener('DOMContentLoaded', function() {
    // Student roster for AP Computer Science Principles
    const students = [
        { firstName: "John", lastName: "Bamford", email: "bamfordj@gonzaga.org", score: 0, present: true, image: "bamford.jpg" },
        { firstName: "Phinn", lastName: "BonSalle", email: "bonsallep@gonzaga.org", score: 0, present: true, image: "bonsalle.jpg" },
        { firstName: "Ryan", lastName: "Casteel", email: "casteelr@gonzaga.org", score: 0, present: true, image: "casteel.jpg" },
        { firstName: "Christian", lastName: "Clarke", email: "clarkec@gonzaga.org", score: 0, present: true, image: "clarke.jpg" },
        { firstName: "Nate", lastName: "Clowers", email: "clowersn@gonzaga.org", score: 0, present: true, image: "clowers.jpg" },
        { firstName: "Tommy", lastName: "Doherty", email: "dohertyt@gonzaga.org", score: 0, present: true, image: "doherty.jpg" },
        { firstName: "Olof", lastName: "Hunnius", email: "hunniuso@gonzaga.org", score: 0, present: true, image: "hunnius.jpg" },
        { firstName: "Zeke", lastName: "Jones", email: "jonesz@gonzaga.org", score: 0, present: true, image: "jones.jpg" },
        { firstName: "Tommy", lastName: "Leland", email: "lelandt@gonzaga.org", score: 0, present: true, image: "leland.jpg" },
        { firstName: "Daniel", lastName: "Mebrahtu", email: "mebrahtud@gonzaga.org", score: 0, present: true, image: "mebrahtu.jpg" },
        { firstName: "Colin", lastName: "Meunier", email: "meunierc@gonzaga.org", score: 0, present: true, image: "meunier.jpg" },
        { firstName: "Matteo", lastName: "Piermarini", email: "piermarinima@gonzaga.org", score: 0, present: true, image: "piermarini.jpg" },
        { firstName: "Alex", lastName: "Rothenberg", email: "rothenberga@gonzaga.org", score: 0, present: true, image: "rothenberg.jpg" },
        { firstName: "Anthony", lastName: "See", email: "seea@gonzaga.org", score: 0, present: true, image: "see.jpg" },
        { firstName: "Dante", lastName: "Uptgrow", email: "uptgrowd@gonzaga.org", score: 0, present: true, image: "uptgrow.jpg" },
        { firstName: "Trevor", lastName: "Weiner", email: "weinert@gonzaga.org", score: 0, present: true, image: "weiner.jpg" }
    ];

    // Game state
    let teams = [];
    let currentTeamIndex = null;
    let currentQuestionNumber = 1;
    
    let currentCaptain = null;
    let captainTeamMembers = [];
    let teamBuildingActive = false;
    let assignedStudents = new Set(); // Track students who are already on teams
    
    // DOM elements
    const nextTeamBtn = document.getElementById('next-team');
    const nextQuestionBtn = document.getElementById('next-question');
    const createTeamsBtn = document.getElementById('create-teams');
    const pickCaptainBtn = document.getElementById('pick-captain');
    const teamSizeSelect = document.getElementById('team-size');
    const selectedTeamDisplay = document.getElementById('selected-team-display');
    const currentQuestionElement = document.getElementById('current-question');
    const minQuestionInput = document.getElementById('min-question');
    const maxQuestionInput = document.getElementById('max-question');
    const teamListElement = document.getElementById('team-list');
    const studentListElement = document.getElementById('student-list');
    const correctAnswerBtn = document.getElementById('correct-answer');
    const incorrectAnswerBtn = document.getElementById('incorrect-answer');
    const resetTeamsBtn = document.getElementById('reset-teams');
    const leaderboardElement = document.getElementById('leaderboard');
    
    // Team building elements
    const teamBuildingArea = document.getElementById('team-building-area');
    const captainNameElement = document.getElementById('captain-name');
    const availableStudentsContainer = document.getElementById('available-students');
    const captainTeamContainer = document.getElementById('captain-team');
    const finishTeamBtn = document.getElementById('finish-team');
    const cancelTeamBuildBtn = document.getElementById('cancel-team-build');
    
    // Initialize the student list
    function initializeStudentList() {
        studentListElement.innerHTML = '';
        students.forEach((student, index) => {
            const studentCard = document.createElement('div');
            studentCard.className = student.present ? 'student-card' : 'student-card absent';
            studentCard.dataset.index = index;
            
            // Add toggle presence button
            const toggleButton = document.createElement('button');
            toggleButton.className = 'student-action';
            toggleButton.textContent = '✕';
            toggleButton.title = student.present ? 'Mark as absent' : 'Mark as present';
            toggleButton.addEventListener('click', () => toggleStudentPresence(index));
            
            // Try multiple possible image paths and filenames
            const imgElement = document.createElement('img');
            imgElement.alt = `${student.firstName} ${student.lastName}`;
            imgElement.onerror = function() {
                // If the image fails to load, try lowercase name
                this.src = `images/${student.lastName.toLowerCase()}.jpg`;
                
                // If that fails too, use default
                this.onerror = function() {
                    this.src = 'images/default.jpg';
                };
            };
            imgElement.src = `images/${student.image}`;
            
            const nameElement = document.createElement('h3');
            nameElement.textContent = `${student.firstName} ${student.lastName}`;
            
            studentCard.appendChild(imgElement);
            studentCard.appendChild(nameElement);
            studentCard.appendChild(toggleButton);
            studentListElement.appendChild(studentCard);
        });
    }
    
    // Updated toggleStudentPresence function to properly handle team building

    function toggleStudentPresence(index) {
        const student = students[index];
        const wasPresent = student.present;
        student.present = !student.present;
        
        const studentCard = document.querySelector(`.student-card[data-index="${index}"]`);
        if (studentCard) {
            if (student.present) {
                studentCard.classList.remove('absent');
            } else {
                studentCard.classList.add('absent');
                
                // If student is now absent, remove them from any active captain's team
                if (teamBuildingActive && captainTeamMembers) {
                    const memberIndex = captainTeamMembers.findIndex(member => member.email === student.email);
                    if (memberIndex !== -1) {
                        captainTeamMembers.splice(memberIndex, 1);
                        showTeamBuildingInterface();
                    }
                    
                    // If this was the captain, cancel team building
                    if (currentCaptain && currentCaptain.email === student.email) {
                        alert('The team captain has been marked absent. Team building canceled.');
                        resetTeamBuilding();
                    }
                }
                
                // Also remove from existing teams if needed
                for (let i = 0; i < teams.length; i++) {
                    const team = teams[i];
                    const memberIndex = team.members.findIndex(member => member.email === student.email);
                    if (memberIndex !== -1) {
                        // Remove student from team
                        team.members.splice(memberIndex, 1);
                        
                        // If the team is now empty, remove it
                        if (team.members.length === 0) {
                            teams.splice(i, 1);
                            i--; // Adjust index since we removed an item
                        }
                        
                        // Remove from assigned students
                        if (isStudentAssigned(student)) {
                            assignedStudents.delete(student.email);
                        }
                        
                        // Update displays
                        displayTeams();
                        updateLeaderboard();
                        
                        break;
                    }
                }
            }
        }
        
        // Don't automatically recreate teams when a student's presence changes
        // Only update the existing team display if needed
        if (teams.length > 0) {
            displayTeams();
            updateLeaderboard();
        }
    }
    
    // Create teams based on selected size - updated to respect already assigned students
    function createTeams() {
        const teamSize = parseInt(teamSizeSelect.value);
        teams = [];
        assignedStudents.clear(); // Reset assignments when creating all new teams
        
        // Get only present students
        const presentStudents = students.filter(student => student.present);
        
        // Shuffle the students array
        const shuffledStudents = [...presentStudents].sort(() => Math.random() - 0.5);
        
        // Create teams
        for (let i = 0; i < shuffledStudents.length; i += teamSize) {
            const teamMembers = shuffledStudents.slice(i, i + teamSize);
            
            const team = {
                id: teams.length + 1,
                members: teamMembers,
                score: 0
            };
            teams.push(team);
            
            // Mark all team members as assigned
            teamMembers.forEach(student => {
                markStudentAsAssigned(student);
            });
        }
        
        // Update student card appearances
        updateAssignedStudentCards();
        
        // Reset current team
        currentTeamIndex = null;
        selectedTeamDisplay.innerHTML = '<p>None selected</p>';
        
        // Display teams
        displayTeams();
        
        // Update the leaderboard
        updateLeaderboard();
    }
    
    // Display teams in the team list
    function displayTeams() {
        teamListElement.innerHTML = '';
        
        teams.forEach((team, index) => {
            const teamCard = document.createElement('div');
            teamCard.className = 'team-card';
            teamCard.dataset.index = index;
            
            const teamTitle = document.createElement('h3');
            teamTitle.textContent = `Team ${team.id}`;
            
            const scoreElement = document.createElement('div');
            scoreElement.className = 'team-score';
            scoreElement.textContent = team.score;
            
            const membersContainer = document.createElement('div');
            membersContainer.className = 'team-members';
            
            team.members.forEach(member => {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'team-member';
                
                const imgElement = document.createElement('img');
                imgElement.alt = member.firstName;
                imgElement.onerror = function() {
                    // If the image fails to load, try lowercase name
                    this.src = `images/${member.lastName.toLowerCase()}.jpg`;
                    
                    // If that fails too, use default
                    this.onerror = function() {
                        this.src = 'images/default.jpg';
                    };
                };
                imgElement.src = `images/${member.image}`;
                
                const nameElement = document.createElement('p');
                nameElement.textContent = member.firstName;
                
                memberDiv.appendChild(imgElement);
                memberDiv.appendChild(nameElement);
                membersContainer.appendChild(memberDiv);
            });
            
            teamCard.appendChild(teamTitle);
            teamCard.appendChild(scoreElement);
            teamCard.appendChild(membersContainer);
            teamListElement.appendChild(teamCard);
        });
    }
    
    // Select a random team
    function selectRandomTeam() {
        if (teams.length === 0) {
            alert('Please create teams first');
            return;
        }
        
        // Clear previous selection
        if (currentTeamIndex !== null) {
            const previousCard = document.querySelector(`.team-card[data-index="${currentTeamIndex}"]`);
            if (previousCard) {
                previousCard.classList.remove('selected');
            }
        }
        
        // Select a new random team
        currentTeamIndex = Math.floor(Math.random() * teams.length);
        const selectedTeam = teams[currentTeamIndex];
        
        // Update the selected team display
        displaySelectedTeam(selectedTeam);
        
        // Update the leaderboard to highlight the selected team
        updateLeaderboard();
        
        // Highlight the selected team card in the main team list, but don't scroll to it
        const card = document.querySelector(`.team-card[data-index="${currentTeamIndex}"]`);
        if (card) {
            card.classList.add('selected');
        }
    }
    
    // Generate a random question within the specified range
    function getRandomQuestion() {
        const min = parseInt(minQuestionInput.value) || 1;
        const max = parseInt(maxQuestionInput.value) || 40;
        
        // Validate range
        let validMin = Math.max(1, Math.min(min, 40));
        let validMax = Math.max(validMin, Math.min(max, 40));
        
        minQuestionInput.value = validMin;
        maxQuestionInput.value = validMax;
        
        // Generate random number within range
        currentQuestionNumber = Math.floor(Math.random() * (validMax - validMin + 1)) + validMin;
        currentQuestionElement.textContent = currentQuestionNumber;
    }
    
    // Pick a random student to be a team captain - modified to exclude already assigned students
    function pickRandomCaptain() {
        // Get present students who aren't already on teams
        const availableStudents = students.filter(student => 
            student.present && !isStudentAssigned(student));
        
        if (availableStudents.length === 0) {
            alert('No available students left to be captain!');
            return;
        }
        
        // Select random student
        const randomIndex = Math.floor(Math.random() * availableStudents.length);
        currentCaptain = availableStudents[randomIndex];
        
        // Update captain display
        captainNameElement.textContent = currentCaptain.firstName + " " + currentCaptain.lastName;
        
        // Highlight captain in student list
        const studentCards = document.querySelectorAll('.student-card');
        studentCards.forEach(card => card.classList.remove('captain'));
        
        const captainIndex = students.findIndex(student => 
            student.firstName === currentCaptain.firstName && 
            student.lastName === currentCaptain.lastName
        );
        
        const captainCard = document.querySelector(`.student-card[data-index="${captainIndex}"]`);
        if (captainCard) {
            captainCard.classList.add('captain');
            
            // Add captain badge if it doesn't exist
            if (!captainCard.querySelector('.captain-badge')) {
                const captainBadge = document.createElement('div');
                captainBadge.className = 'captain-badge';
                captainBadge.textContent = 'C';
                captainCard.appendChild(captainBadge);
            }
            
            // Remove scrolling to captain card
            // captainCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Reset and show team building interface
        captainTeamMembers = [currentCaptain];
        teamBuildingActive = true;
        teamBuildingArea.classList.remove('hidden');
        
        // Show team building interface
        showTeamBuildingInterface();
    }
    
    // Show the team building interface - modified to exclude already assigned students
    function showTeamBuildingInterface() {
        if (!currentCaptain) return;
        
        // Reset containers
        availableStudentsContainer.innerHTML = '';
        captainTeamContainer.innerHTML = '';
        
        // Display captain in their team
        const captainElement = createStudentSelectionElement(currentCaptain);
        captainTeamContainer.appendChild(captainElement);
        
        // Show the captain's current team members (if any)
        captainTeamMembers.forEach(member => {
            if (member !== currentCaptain) {
                const memberElement = createStudentSelectionElement(member);
                memberElement.addEventListener('click', () => removeMemberFromTeam(member));
                captainTeamContainer.appendChild(memberElement);
            }
        });
        
        // Get team size
        const teamSize = parseInt(teamSizeSelect.value);
        
        // Show or hide the finish button based on team size
        if (captainTeamMembers.length >= teamSize) {
            finishTeamBtn.classList.remove('hidden');
        } else {
            finishTeamBtn.classList.add('hidden');
        }
        
        // Show available students - excluding those already on teams
        const availableStudents = students.filter(student => 
            student.present && 
            !captainTeamMembers.includes(student) &&
            !isStudentAssigned(student)
        );
        
        availableStudents.forEach(student => {
            const studentElement = createStudentSelectionElement(student);
            studentElement.addEventListener('click', () => addMemberToTeam(student));
            availableStudentsContainer.appendChild(studentElement);
        });
    }
    
    // Create a student element for the team building interface
    function createStudentSelectionElement(student) {
        const element = document.createElement('div');
        element.className = 'student-selection';
        element.dataset.email = student.email;
        
        const imgElement = document.createElement('img');
        imgElement.alt = student.firstName;
        imgElement.onerror = function() {
            // If the image fails to load, try lowercase name
            this.src = `images/${student.lastName.toLowerCase()}.jpg`;
            
            // If that fails too, use default
            this.onerror = function() {
                this.src = 'images/default.jpg';
            };
        };
        imgElement.src = `images/${student.image}`;
        
        const nameElement = document.createElement('p');
        nameElement.textContent = student.firstName;
        
        element.appendChild(imgElement);
        element.appendChild(nameElement);
        
        return element;
    }
    
    // Add a member to the captain's team
    function addMemberToTeam(student) {
        // Get team size
        const teamSize = parseInt(teamSizeSelect.value);
        
        // Check if team is already full
        if (captainTeamMembers.length >= teamSize) {
            alert(`Team is already at maximum size (${teamSize})`);
            return;
        }
        
        captainTeamMembers.push(student);
        showTeamBuildingInterface();
    }
    
    // Remove a member from the captain's team
    function removeMemberFromTeam(student) {
        // Don't allow removing the captain
        if (student === currentCaptain) return;
        
        captainTeamMembers = captainTeamMembers.filter(member => member !== student);
        showTeamBuildingInterface();
    }
    
    // Finish building the current team - updated to check for remaining students
    function finishTeam() {
        if (!currentCaptain || captainTeamMembers.length === 0) return;
        
        // Create a new team
        const newTeam = {
            id: teams.length + 1,
            members: [...captainTeamMembers],
            score: 0
        };
        
        teams.push(newTeam);
        
        // Mark team members as assigned
        captainTeamMembers.forEach(student => {
            markStudentAsAssigned(student);
        });
        
        // Update student card appearances
        updateAssignedStudentCards();
        
        // Display teams
        displayTeams();
        
        // Update the leaderboard
        updateLeaderboard();
        
        // Reset team building
        resetTeamBuilding();
        
        // Check remaining students
        const remainingStudents = students.filter(student => 
            student.present && !isStudentAssigned(student));
        
        // If we have exactly 2 students remaining, auto group them
        if (remainingStudents.length === 2) {
            // Create a new team with the remaining students
            const leftoverTeam = {
                id: teams.length + 1,
                members: [...remainingStudents],
                score: 0
            };
            
            teams.push(leftoverTeam);
            
            // Mark them as assigned
            remainingStudents.forEach(student => {
                markStudentAsAssigned(student);
            });
            
            // Update student card appearances
            updateAssignedStudentCards();
            
            // Update display
            displayTeams();
            updateLeaderboard();
            
            // Show a message
            alert(`Automatically grouped the last 2 remaining students into Team ${leftoverTeam.id}`);
        }
    }
    
    // Cancel team building
    function cancelTeamBuilding() {
        resetTeamBuilding();
    }
    
    // Reset team building state - don't clear assignments when canceling
    function resetTeamBuilding() {
        currentCaptain = null;
        captainTeamMembers = [];
        teamBuildingActive = false;
        teamBuildingArea.classList.add('hidden');
        
        // Remove captain highlighting
        const captainCards = document.querySelectorAll('.student-card.captain');
        captainCards.forEach(card => {
            card.classList.remove('captain');
            const badge = card.querySelector('.captain-badge');
            if (badge) badge.remove();
        });
    }
    
    // Award points to current team
    function awardPoints() {
        if (currentTeamIndex !== null) {
            teams[currentTeamIndex].score += 1;
            updateTeamScore(currentTeamIndex);
        } else {
            alert('Please select a team first');
        }
    }
    
    // Mark incorrect answer
    function markIncorrect() {
        // In this implementation, we don't deduct points for wrong answers
        // But we could if desired
        
        // Move to next team after incorrect answer
        selectRandomTeam();
    }
    
    // Update a team's displayed score
    function updateTeamScore(index) {
        const card = document.querySelector(`.team-card[data-index="${index}"]`);
        if (card) {
            const scoreElement = card.querySelector('.team-score');
            scoreElement.textContent = teams[index].score;
        }
        
        // Update the leaderboard to reflect the new score
        updateLeaderboard();
    }
    
    // Check if a student is already assigned to a team
    function isStudentAssigned(student) {
        return assignedStudents.has(student.email);
    }
    
    // Mark a student as assigned to a team
    function markStudentAsAssigned(student) {
        assignedStudents.add(student.email);
    }
    
    // Update the visual appearance of assigned student cards
    function updateAssignedStudentCards() {
        students.forEach((student, index) => {
            const studentCard = document.querySelector(`.student-card[data-index="${index}"]`);
            if (studentCard) {
                if (isStudentAssigned(student)) {
                    studentCard.classList.add('assigned');
                    
                    // Add "assigned" indicator if it doesn't exist
                    if (!studentCard.querySelector('.assigned-indicator')) {
                        const assignedIndicator = document.createElement('div');
                        assignedIndicator.className = 'assigned-indicator';
                        assignedIndicator.textContent = '✓';
                        studentCard.appendChild(assignedIndicator);
                    }
                } else {
                    studentCard.classList.remove('assigned');
                    const indicator = studentCard.querySelector('.assigned-indicator');
                    if (indicator) indicator.remove();
                }
            }
        });
    }
    
    // Add this function to update the leaderboard
    function updateLeaderboard() {
        if (teams.length === 0) {
            leaderboardElement.innerHTML = '<div class="no-teams-message">No teams created yet</div>';
            return;
        }
        
        // Sort teams by score (descending)
        const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
        
        leaderboardElement.innerHTML = '';
        
        // Display top teams
        sortedTeams.forEach((team, index) => {
            const teamElement = document.createElement('div');
            teamElement.className = 'leaderboard-team';
            
            // Add special classes for top 3 ranks
            if (index === 0) teamElement.classList.add('rank-1');
            if (index === 1) teamElement.classList.add('rank-2');
            if (index === 2) teamElement.classList.add('rank-3');
            
            // If this is the currently selected team, highlight it
            const teamIndex = teams.indexOf(team);
            if (teamIndex === currentTeamIndex) {
                teamElement.classList.add('selected');
            }
            
            // Add team info
            let membersPreview = '';
            team.members.forEach(member => {
                membersPreview += `<img src="images/${member.image}" alt="${member.firstName}" class="member-icon" onerror="this.src='images/${member.lastName.toLowerCase()}.jpg'; this.onerror=function(){this.src='images/default.jpg'};">`;
            });
            
            teamElement.innerHTML = `
                <div class="team-info">
                    <div class="team-rank">${index + 1}</div>
                    <div class="team-members-preview">${membersPreview}</div>
                    <div class="team-name">Team ${team.id}</div>
                </div>
                <div class="team-points">${team.score}</div>
            `;
            
            // Add click handler to select this team
            teamElement.addEventListener('click', () => {
                // Clear previous selection
                if (currentTeamIndex !== null) {
                    const previousCard = document.querySelector(`.team-card[data-index="${currentTeamIndex}"]`);
                    if (previousCard) {
                        previousCard.classList.remove('selected');
                    }
                }
                
                currentTeamIndex = teamIndex;
                
                // Update the selected team display
                displaySelectedTeam(team);
                
                // Update leaderboard to reflect selection
                updateLeaderboard();
                
                // Highlight in the main team list, but don't scroll to it
                const card = document.querySelector(`.team-card[data-index="${teamIndex}"]`);
                if (card) {
                    card.classList.add('selected');
                }
            });
            
            leaderboardElement.appendChild(teamElement);
        });
    }
    
    // Extract the display selected team functionality to a separate function
    function displaySelectedTeam(team) {
        selectedTeamDisplay.innerHTML = '';
        
        team.members.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'team-member';
            
            const imgElement = document.createElement('img');
            imgElement.alt = member.firstName;
            imgElement.onerror = function() {
                // If the image fails to load, try lowercase name
                this.src = `images/${member.lastName.toLowerCase()}.jpg`;
                
                // If that fails too, use default
                this.onerror = function() {
                    this.src = 'images/default.jpg';
                };
            };
            imgElement.src = `images/${member.image}`;
            
            const nameElement = document.createElement('p');
            nameElement.textContent = member.firstName;
            
            memberDiv.appendChild(imgElement);
            memberDiv.appendChild(nameElement);
            selectedTeamDisplay.appendChild(memberDiv);
        });
    }
    
    // Add this function for resetting teams
    function resetAllTeams() {
        if (confirm('Are you sure you want to reset all teams? This will clear all team assignments and scores.')) {
            teams = [];
            assignedStudents.clear();
            currentTeamIndex = null;
            selectedTeamDisplay.innerHTML = '<p>None selected</p>';
            teamListElement.innerHTML = '';
            updateAssignedStudentCards();
            
            // Update the leaderboard
            updateLeaderboard();
        }
    }
    
    // Add this function to automatically group remaining students
    function autoGroupRemainingStudents() {
        // Check if we have any students left to group
        const remainingStudents = students.filter(student => 
            student.present && !isStudentAssigned(student));
        
        if (remainingStudents.length === 0) {
            return; // No students left to group
        }
        
        // Create a team with the remaining students
        const newTeam = {
            id: teams.length + 1,
            members: [...remainingStudents],
            score: 0
        };
        
        teams.push(newTeam);
        
        // Mark all members as assigned
        remainingStudents.forEach(student => {
            markStudentAsAssigned(student);
        });
        
        // Update student card appearances
        updateAssignedStudentCards();
        
        // Update display
        displayTeams();
        updateLeaderboard();
        
        // Show a message
        alert(`Auto-grouped ${remainingStudents.length} remaining student${remainingStudents.length > 1 ? 's' : ''} into Team ${newTeam.id}`);
    }

    // Add this function to handle section navigation
    function initializeSectionNavigation() {
        const sectionNavButtons = document.querySelectorAll('.section-nav-btn');
        
        sectionNavButtons.forEach(button => {
            button.addEventListener('click', function() {
                const sectionId = this.dataset.section;
                const section = document.querySelector(`.${sectionId}`);
                
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // Event listeners
    nextTeamBtn.addEventListener('click', selectRandomTeam);
    nextQuestionBtn.addEventListener('click', getRandomQuestion);
    createTeamsBtn.addEventListener('click', createTeams);
    correctAnswerBtn.addEventListener('click', awardPoints);
    incorrectAnswerBtn.addEventListener('click', markIncorrect);
    pickCaptainBtn.addEventListener('click', pickRandomCaptain);
    finishTeamBtn.addEventListener('click', finishTeam);
    cancelTeamBuildBtn.addEventListener('click', cancelTeamBuilding);
    resetTeamsBtn.addEventListener('click', resetAllTeams);
    
    // Initialize the game
    initializeStudentList();
    updateLeaderboard();
    initializeSectionNavigation();
});