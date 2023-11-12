"use strict";

function botsweeper(canvas, initial_width, initial_height, initial_mines) {
    canvas.tabIndex = 1000;
    canvas.style.outline = "none";

    function load_assets() {
        const cell_up = new Image();
        cell_up.src = "cell_up.png";

        const cell_down = new Image();
        cell_down.src = "cell_down.png";

        const digits = [];
        for (let i = 1; i < 9; ++i) {
            const digit = new Image();
            digit.src = `digit_${i}.png`;
            digits.push(digit);
        }

        const bot = new Image();
        bot.src = "bot.png";

        const flag = new Image();
        flag.src = "flag.png";

        const cursor = new Image();
        cursor.src = "cursor.png";

        return {
            cell_up,
            cell_down,
            digits,
            bot,
            flag,
            cursor,
        };
    }

    const assets = load_assets();

    let width, height;      // Current size of the board
    let mines;              // Number of mines on the board
    let cursor_x, cursor_y; // Current cursor position
    let show_cursor = true; // Whether or not the cursor should be drawn
    let opening;            // Whether or not the button to open a cell is pressed
    let dead;               // Whether or not the player is dead
    let cheat;              // Whether or not the cheat button is pressed
    let board = [];

    function restart_with_parameters(new_width, new_height, new_mines) {
        width = new_width;
        height = new_height;
        mines = new_mines;

        canvas.width = width * 24;
        canvas.height = height * 24;

        cursor_x = Math.min(cursor_x, width - 1);
        cursor_y = Math.min(cursor_y, height - 1);
        opening = false;
        dead = false;
        cheat = false;

        board = build_board(width, height, mines);
    }

    restart_with_parameters(initial_width, initial_height, initial_mines);

    const ctx = canvas.getContext("2d");

    function open() {
        const cell = board[index(width, cursor_x, cursor_y)];

        if (cell.is_flagged) {
            return;
        }

        open_cell(cell);
    }

    function open_cell(cell) {
        if (!cell.is_open) {
            cell.is_open = true;
            cell.is_flagged = false;

            if (cell.is_mined) {
                dead = true;
            }

            if (cell.neighboring_mines === 0) {
                for (let i = 0; i < cell.neighbors.length; ++i) {
                    let neighbor = cell.neighbors[i];
                    open_cell(neighbor);
                }
            }
        }
    }

    function flag(x, y) {
        const cell = board[index(width, x, y)];
        if (!cell.is_open) {
            cell.is_flagged = !cell.is_flagged;
        }
    }

    function clear(x, y) {
        const cell = board[index(width, x, y)];
        if (!cell.is_open) {
            return;
        }
        let flag_count = 0;
        for (let i = 0; i < cell.neighbors.length; ++i) {
            const neighbor = cell.neighbors[i];
            if (neighbor.is_flagged) {
                flag_count += 1;
            }
        }
        if (flag_count === cell.neighboring_mines) {
            for (let i = 0; i < cell.neighbors.length; ++i) {
                const neighbor = cell.neighbors[i];
                if (!neighbor.is_flagged) {
                    open_cell(neighbor);
                }
            }
        }
    }

    function on_key_down(evt) {
        switch (evt.code) {
            case "KeyC":
                cheat = true;
                break;
            case "KeyR":
                board = build_board(width, height, mines);
                dead = false;
                cursor_x = 0;
                cursor_y = 0;
                break;
        }
        show_cursor = true;
        if (dead) {
            return;
        }
        switch (evt.code) {
            case "ArrowDown":
                cursor_y = Math.min(height - 1, cursor_y + 1);
                break;
            case "ArrowUp":
                cursor_y = Math.max(0, cursor_y - 1);
                break;
            case "ArrowLeft":
                cursor_x = Math.max(0, cursor_x - 1);
                break;
            case "ArrowRight":
                cursor_x = Math.min(width - 1, cursor_x + 1);
                break;
            case "Space":
                opening = true;
                break;
            case "KeyF":
                flag(cursor_x, cursor_y);
                break;
            case "KeyG":
                clear(cursor_x, cursor_y);
                break;
        }
    }

    function on_key_up(evt) {
        switch (evt.code) {
            case "KeyC":
                cheat = false;
                break;
        }
        if (dead) {
            return;
        }
        switch (evt.code) {
            case "Space":
                opening = false;
                open();
                break;
        }
    }

    canvas.addEventListener("keydown", on_key_down, true);
    canvas.addEventListener("keyup", on_key_up, true);

    function on_mouse_move(event) {
        if (dead) {
            return;
        }
        const { offsetX, offsetY } = event;
        cursor_x = Math.floor(offsetX / 24);
        cursor_y = Math.floor(offsetY / 24);
        show_cursor = false;
    }

    function on_mouse_down(event) {
        if (dead) {
            return;
        }

        switch (event.button) {
            case 0:
                opening = true;
                break;
            case 1:
                clear(cursor_x, cursor_y);
                break;
            case 2:
                flag(cursor_x, cursor_y);
                break;
        }
    }

    function on_mouse_up(event) {
        if (dead) {
            return;
        }

        switch (event.button) {
            case 0:
                opening = false;
                open();
                break;
        }
    }

    canvas.addEventListener("mousemove", on_mouse_move, true);
    canvas.addEventListener("mousedown", on_mouse_down, true);
    canvas.addEventListener("mouseup", on_mouse_up, true);
    canvas.addEventListener("contextmenu", e => {
        e.preventDefault();
    }, true);

    function run() {
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const px_x = x * 24;
                const px_y = y * 24;

                function draw(image) {
                    ctx.drawImage(image, px_x, px_y);
                }

                const cell = board[index(width, x, y)];

                if (cell.is_open || cheat || dead) {
                    draw(assets.cell_down);

                    if (cell.is_mined) {
                        draw(assets.bot);
                    } else if (cell.neighboring_mines > 0) {
                        draw(assets.digits[cell.neighboring_mines - 1]);
                    }
                } else if (cursor_x === x && cursor_y === y && opening) {
                    draw(assets.cell_down);
                } else {
                    draw(assets.cell_up);
                }

                if (cell.is_flagged) {
                    draw(assets.flag);
                }

                if (show_cursor && cursor_x === x && cursor_y === y) {
                    draw(assets.cursor);
                }
            }
        }

        requestAnimationFrame(run);
    }

    canvas.focus();
    run();

    return { start: restart_with_parameters };
}

function build_board(width, height, mines) {
    const cells = [];

    let mines_placed = 0;

    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            const cell = {
                is_mined: false,
                is_open: false,
                is_flagged: false,
                neighboring_mines: 0,
                neighbors: [],
            };

            if (mines_placed < mines) {
                mines_placed = mines_placed + 1;
                cell.is_mined = true;
            }

            cells.push(cell);
        }
    }

    shuffle(cells);

    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            const cell = cells[index(width, x, y)];

            for (let n_y = y - 1; n_y <= y + 1; ++n_y) {
                for (let n_x = x - 1; n_x <= x + 1; ++n_x) {
                    const valid_x = n_x >= 0 && n_x < width;
                    const valid_y = n_y >= 0 && n_y < height;

                    if (valid_x && valid_y && !(n_x === x && n_y === y)) {
                        const neighbor = cells[index(width, n_x, n_y)];
                        cell.neighbors.push(neighbor);

                        if (neighbor.is_mined) {
                            cell.neighboring_mines = cell.neighboring_mines + 1;
                        }
                    }
                }
            }
        }
    }

    return cells;
}

function index(width, x, y) {
    return width * y + x;
}

// Fisher-Yates Shuffle
function shuffle(array) {
    let current_index = array.length;
  
    // While there remain elements to shuffle.
    while (current_index > 0) {
  
      // Pick a remaining element.
      let random_index = Math.floor(Math.random() * current_index);
      current_index--;
  
      // And swap it with the current element.
      [array[current_index], array[random_index]] = [
        array[random_index], array[current_index]];
    }
  
    return array;
}
