package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"path"
	"strings"

	"github.com/gorilla/mux"
	"github.com/nimezhu/asheets"
	"github.com/nimezhu/data"
	"github.com/nimezhu/sand"
	"github.com/urfave/cli"
	"golang.org/x/oauth2/google"
	sheets "google.golang.org/api/sheets/v4"
)

const (
	STATIC_DIR = "/static/"
	WASM_DIR   = "/wasm/"
	ENTRY_DIR  = "/entry/"
	LOCAL_DIR  = "/local/"
)

func checkErr(e error) {
	if e != nil {
		panic(e)
	}
}

func wasm(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ext := path.Ext(path.Base(r.URL.Path))
		fmt.Println(ext, r.URL.Path, r.RequestURI, r.URL)
		if ext == ".wasm" {
			w.Header().Set("Content-Type", "application/wasm")
		}
		next.ServeHTTP(w, r)
	})
}
func CmdStart(c *cli.Context) error {
	uri := c.String("input")
	port := c.Int("port")
	//mode := c.String("mode")
	root := c.String("root")
	router := mux.NewRouter()
	router.
		PathPrefix(STATIC_DIR).
		Handler(http.StripPrefix(STATIC_DIR, http.FileServer(http.Dir("."+STATIC_DIR))))
	router.
		PathPrefix(WASM_DIR).
		Handler(wasm(http.StripPrefix(WASM_DIR, http.FileServer(http.Dir("."+WASM_DIR)))))
	// Router Add Content-Type Automatically
	router.
		PathPrefix(LOCAL_DIR).
		Handler(http.StripPrefix(LOCAL_DIR, http.FileServer(http.Dir("."+LOCAL_DIR))))

	router.HandleFunc("/entry/{page}/__{rest:.*}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		page := vars["page"]
		rest := vars["rest"]
		http.Redirect(w, r, ENTRY_DIR+"?page="+page+"&rest="+rest, http.StatusTemporaryRedirect)
	})
	router.HandleFunc("/entry/{page}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		page := vars["page"]
		title, ok := r.URL.Query()["title"]
		sheetid, ok1 := r.URL.Query()["sheetid"]
		s := "a=1"
		if page != "null" && page != "" {
			s += "&page=" + page
		}
		if ok {
			s += "&title=" + title[0]
		}
		if ok1 {
			s += "&sheetid=" + sheetid[0]
		}
		http.Redirect(w, r, ENTRY_DIR+"?"+s, http.StatusTemporaryRedirect)
	})
	router.
		PathPrefix(ENTRY_DIR).
		Handler(http.StripPrefix(ENTRY_DIR, http.FileServer(http.Dir("."+ENTRY_DIR))))
	// Content Entry Dir index.html

	router.HandleFunc("/entry", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, ENTRY_DIR, http.StatusTemporaryRedirect)
	})

	router.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		target := STATIC_DIR + "favicon.ico"
		http.Redirect(w, r, target,
			http.StatusTemporaryRedirect)
	})
	router.HandleFunc("/google7b85f0fbc551bde9.html", func(w http.ResponseWriter, r *http.Request) {
		target := STATIC_DIR + "google7b85f0fbc551bde9.html"
		http.Redirect(w, r, target,
			http.StatusTemporaryRedirect)
	})
	//addBindata(router)
	cred := c.String("cred")
	extID := c.String("ext")

	libs := []string{
		"/local/lib/snow.min.js",
	}
	tail := []string{
		"/local/lib/onload.js",
		"/static/lib/app.js",
	}
	styles := []string{
		"/local/style/handsontable.min.css",
		"/local/style/snow.css",
		"/static/css/robotomono.css",
		"/static/css/dat-gui-nb-theme.css",
	}
	modes := map[string]string{}
	s := sand.Sand{
		"Nucleome Browser",
		root,
		".cnb",
		VERSION,
		libs,
		tail,
		styles,
		"snow.render",
		modes,
		extID,
	}
	idxRoot := s.InitIdxRoot(root) //???
	sand.InitCred(cred)
	addDataServer(uri, router, idxRoot)
	s.InitRouter(router)
	s.InitHome(root)

	// TODO Get uri Testers Config
	if v, ok := readGSheetTesters(path.Join(root, ".cnb"), uri); ok {
		fmt.Println("users", v)
		router.Use(sand.TesterMiddlewareFactory(v))
	}
	//router.Use(data.CorsMiddleware) //if has data
	//router.Use(cnbData.UserMiddleware)      //if has data
	s.Start(port, router)
	return nil
}

/* Testers , ColId: email
 * TODO : MORE Users Management
 */
func readGSheetTesters(root string, uri string) (map[string]bool, bool) {
	ctx := context.Background()
	b, err := data.Asset("client_secret.json")
	if err != nil {
		log.Fatalf("Unable to read client secret file: %v", err)
	}
	config, err := google.ConfigFromJSON(b, "https://www.googleapis.com/auth/spreadsheets")
	gA := asheets.NewGAgent(root)
	client := gA.GetClient(ctx, config)
	srv, err := sheets.New(client)
	if err != nil {
		log.Fatalf("Unable to retrieve Sheets Client %v", err)
	}
	m, err := asheets.ReadSheet("Testers", srv, uri, "A")
	if err != nil {
		return nil, false
	}
	retv := make(map[string]bool)
	emailI := -1
	for i, k := range m.ColIds {
		if strings.ToLower(k) == "email" {
			emailI = i
		}
	}
	if emailI < 0 {
		return nil, false
	}
	for _, v := range m.RowIds {
		a := m.RowValue[v][emailI]
		retv[string(a)] = true
	}
	return retv, true
}
