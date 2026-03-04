#!/usr/bin/env node
// Skills auto-update hook - runs on SessionStart
import { spawn } from 'child_process';
const child = spawn('skills', ['update'], { stdio: 'ignore', detached: true });
child.unref();
