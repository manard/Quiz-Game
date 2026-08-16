-- CreateTable
CREATE TABLE "GameSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quiz_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "current_player_slot" INTEGER,
    "current_question_order" INTEGER,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameSession_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionPlayer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "game_session_id" INTEGER NOT NULL,
    "player_slot" INTEGER NOT NULL,
    "display_name" TEXT NOT NULL,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    CONSTRAINT "SessionPlayer_game_session_id_fkey" FOREIGN KEY ("game_session_id") REFERENCES "GameSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlayerAnswer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_player_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "selected_option_id" INTEGER,
    "is_correct" BOOLEAN NOT NULL,
    "timed_out" BOOLEAN NOT NULL,
    "response_time_seconds" REAL,
    "answered_at" DATETIME,
    CONSTRAINT "PlayerAnswer_session_player_id_fkey" FOREIGN KEY ("session_player_id") REFERENCES "SessionPlayer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlayerAnswer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlayerAnswer_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "Option" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionPlayer_game_session_id_player_slot_key" ON "SessionPlayer"("game_session_id", "player_slot");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerAnswer_session_player_id_question_id_key" ON "PlayerAnswer"("session_player_id", "question_id");
