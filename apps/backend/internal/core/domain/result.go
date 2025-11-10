package domain

type Result struct {
	ID       int64  `json:"id"`
	EventID  int64  `json:"event_id"`
	RunnerID int64  `json:"runner_id"`
	Time     string `json:"time"`
}
